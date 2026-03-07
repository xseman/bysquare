package main

// FFI Lifecycle:
//    PAY_ENCODE:     bysquare_pay_encode(json, config) -> *char (C heap, caller must free)
//    PAY_DECODE:     bysquare_pay_decode(qr) -> *json (C heap, caller must free)
//    INVOICE_ENCODE: bysquare_invoice_encode(json, config) -> *char
//    INVOICE_DECODE: bysquare_invoice_decode(qr) -> *json
//    DETECT:         bysquare_detect_type(qr) -> int (0=pay, 1=invoice, -1=error)
//    CLEANUP:        free(ptr)
//
// Configuration is passed as a bitflag integer (C.int):
//    Bits 0-23:  Configuration flags (24 available)
//        Bit 0 (0x00000001): BYSQUARE_DEBURR - enable diacritics removal
//        Bit 1 (0x00000002): BYSQUARE_VALIDATE - enable input validation
//        Bits 2-23:         Reserved for future flags
//    Bits 24-31: Version field (uint8, 0-255)
//        Mask:      0xFF000000
//        Shift:     24
//
//    Special values:
//        -1 (0xFFFFFFFF): Use default config
//        0:               v1.0.0, no flags (all bits zero)
//        Other:           Custom config bitflags
//
//    Pay defaults:     0x02000003 = version 2 (v1.2.0) + deburr + validate
//    Invoice defaults: 0x00000002 = version 0 (v1.0.0) + validate (no deburr)
//
// Error Handling:
//    Success: Returns raw result string (QR code or JSON)
//    Failure: Returns "ERROR:<message>" (starts with "ERROR:" prefix)
//    Panic recovery prevents host process crash but still requires free
//    Detection: Check if result starts with "ERROR:"

/*
#include <stdlib.h>
#include <string.h>
*/
import "C"
import (
	"encoding/json"
	"fmt"
	"unsafe"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/invoice"
	"github.com/xseman/bysquare/go/pkg/bysquare/pay"
)

// version is set by ldflags at build time
var version = "dev"

// Bitflags and configuration constants
const (
	FlagDeburr   = 0b00000000_00000000_00000000_00000001 // Bit 0: Enable diacritics removal
	FlagValidate = 0b00000000_00000000_00000000_00000010 // Bit 1: Enable input validation
	MaskVersion  = 0b11111111_00000000_00000000_00000000 // Bits 24-31: Version field (uint8, 0-255)

	// VersionShift is the bit position where version starts (high byte)
	VersionShift = 24

	// PayDefaults: version=2 (v1.2.0), deburr=true, validate=true
	PayDefaults = (int(bysquare.Version120) << VersionShift) | FlagDeburr | FlagValidate

	// InvoiceDefaults: version=0 (v1.0.0), validate=true (no deburr)
	InvoiceDefaults = (int(bysquare.Version100) << VersionShift) | FlagValidate
)

//export bysquare_pay_encode
func bysquare_pay_encode(input *C.char, config C.int) (ret *C.char) {
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if input == nil {
		return C.CString("ERROR:null input")
	}

	length := C.strlen(input)
	inputBytes := unsafe.Slice((*byte)(unsafe.Pointer(input)), length)

	var model pay.DataModel
	if err := json.Unmarshal(inputBytes, &model); err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON parse error: %s", err.Error()))
	}

	if config == -1 {
		config = C.int(PayDefaults)
	}

	opts := pay.EncodeOptions{
		Deburr:   (config & FlagDeburr) != 0,
		Validate: (config & FlagValidate) != 0,
		Version:  bysquare.Version((uint32(config) & MaskVersion) >> VersionShift),
	}

	result, err := pay.Encode(model, opts)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	return C.CString(result)
}

//export bysquare_pay_decode
func bysquare_pay_decode(qrString *C.char) (ret *C.char) {
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if qrString == nil {
		return C.CString("ERROR:null input")
	}

	input := C.GoString(qrString)

	model, err := pay.Decode(input)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	output, err := json.Marshal(model)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON marshal error: %s", err.Error()))
	}

	return C.CString(string(output))
}

//export bysquare_invoice_encode
func bysquare_invoice_encode(input *C.char, config C.int) (ret *C.char) {
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if input == nil {
		return C.CString("ERROR:null input")
	}

	length := C.strlen(input)
	inputBytes := unsafe.Slice((*byte)(unsafe.Pointer(input)), length)

	var model invoice.DataModel
	if err := json.Unmarshal(inputBytes, &model); err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON parse error: %s", err.Error()))
	}

	if config == -1 {
		config = C.int(InvoiceDefaults)
	}

	opts := invoice.EncodeOptions{
		Validate: (config & FlagValidate) != 0,
		Version:  bysquare.Version((uint32(config) & MaskVersion) >> VersionShift),
	}

	result, err := invoice.Encode(&model, opts)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	return C.CString(result)
}

//export bysquare_invoice_decode
func bysquare_invoice_decode(qrString *C.char) (ret *C.char) {
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if qrString == nil {
		return C.CString("ERROR:null input")
	}

	input := C.GoString(qrString)

	model, err := invoice.Decode(input)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	output, err := json.Marshal(model)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON marshal error: %s", err.Error()))
	}

	return C.CString(string(output))
}

//export bysquare_detect_type
func bysquare_detect_type(qrString *C.char) C.int {
	if qrString == nil {
		return -1
	}

	input := C.GoString(qrString)

	rawBytes, err := bysquare.DecodeBase32Hex(input, true)
	if err != nil || len(rawBytes) < 2 {
		return -1
	}

	header := bysquare.ParseBysquareHeader(rawBytes[:2])
	return C.int(header.BySquareType)
}

//export bysquare_free
func bysquare_free(ptr *C.char) {
	C.free(unsafe.Pointer(ptr))
}

//export bysquare_version
func bysquare_version() *C.char {
	return C.CString(version)
}

func main() {}

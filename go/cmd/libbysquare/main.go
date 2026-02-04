package main

// FFI Lifecycle:
//   ENCODE:  encode(json, config) -> *char (C heap, caller must free)
//   DECODE:  decode(qr) -> *json (C heap, caller must free)
//   CLEANUP: free(ptr)
//
// Configuration is passed as a bitflag integer (C.int):
//   Bits 0-23:  Configuration flags (24 available)
//     Bit 0 (0x00000001): BYSQUARE_DEBURR - enable diacritics removal
//     Bit 1 (0x00000002): BYSQUARE_VALIDATE - enable input validation
//     Bits 2-23:         Reserved for future flags
//   Bits 24-31: Version field (uint8, 0-255)
//     Mask:      0xFF000000
//     Shift:     24
//
//   Special values:
//     0:          Use default config (v1.2.0 + deburr + validate)
//     Other:      Custom config bitflags
//
//   Example: 0x02000003 = version 2 (v1.2.0) + deburr + validate (default)
//
// Error Handling:
//   Success: Returns raw result string (QR code or JSON)
//   Failure: Returns "ERROR:<message>" (starts with "ERROR:" prefix)
//   Panic recovery prevents host process crash but still requires free
//   Detection: Check if result starts with "ERROR:"

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
)

// version is set by ldflags at build time
var version = "dev"

// Config bitflags for bysquare_encode
const (
	ConfigDeburr   = 0b00000001                            // Bit 0: Enable diacritics removal
	ConfigValidate = 0b00000010                            // Bit 1: Enable input validation
	ConfigVersion  = 0b11111111_00000000_00000000_00000000 // Bits 24-31: Version field (uint8, 0-255)

	// VersionShift is the bit position where version starts (high byte)
	VersionShift = 24

	// version=2 (v1.2.0), deburr=true, validate=true
	// 0b00000010_00000000_00000000_00000011
	ConfigDefault = (int(bysquare.Version120) << VersionShift) | ConfigDeburr | ConfigValidate
)

//export bysquare_encode
func bysquare_encode(jsonData *C.char, config C.int) (ret *C.char) {
	// Recover from any panics to prevent crashing the host process
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if jsonData == nil {
		return C.CString("ERROR:null input")
	}

	// Zero-copy: Create []byte view directly into C memory
	// CGO safety: json.Unmarshal only reads during this call, doesn't retain references
	// per Go's CGO pointer passing rules (https://pkg.go.dev/cmd/cgo#hdr-Passing_pointers)
	length := C.strlen(jsonData)
	inputBytes := unsafe.Slice((*byte)(unsafe.Pointer(jsonData)), length)

	var model bysquare.DataModel
	if err := json.Unmarshal(inputBytes, &model); err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON parse error: %s", err.Error()))
	}

	// Use default config if 0 is passed
	if config == 0 {
		config = C.int(ConfigDefault)
	}

	// Parse config bitflags
	opts := bysquare.EncodeOptions{
		Deburr:   (config & ConfigDeburr) != 0,
		Validate: (config & ConfigValidate) != 0,
		Version:  bysquare.Version((uint32(config) & ConfigVersion) >> VersionShift),
	}

	result, err := bysquare.Encode(model, opts)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	return C.CString(result)
}

//export bysquare_decode
func bysquare_decode(qrString *C.char) (ret *C.char) {
	// Recover from any panics to prevent crashing the host process
	defer func() {
		if r := recover(); r != nil {
			ret = C.CString(fmt.Sprintf("ERROR:panic: %v", r))
		}
	}()

	if qrString == nil {
		return C.CString("ERROR:null input")
	}

	input := C.GoString(qrString)

	model, err := bysquare.Decode(input)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:%s", err.Error()))
	}

	output, err := json.Marshal(model)
	if err != nil {
		return C.CString(fmt.Sprintf("ERROR:JSON marshal error: %s", err.Error()))
	}

	return C.CString(string(output))
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

package main

/*
#include <stdlib.h>
*/
import "C"
import (
	"encoding/json"
	"fmt"
	"unsafe"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

//export bysquare_encode
func bysquare_encode(jsonData *C.char) *C.char {
	input := C.GoString(jsonData)

	var model bysquare.DataModel
	if err := json.Unmarshal([]byte(input), &model); err != nil {
		errJSON := fmt.Sprintf(`{"error": "JSON parse error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	result, err := bysquare.Encode(model)
	if err != nil {
		errJSON := fmt.Sprintf(`{"error": "Encoding error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	return C.CString(result)
}

//export bysquare_decode
func bysquare_decode(qrString *C.char) *C.char {
	input := C.GoString(qrString)

	model, err := bysquare.Decode(input)
	if err != nil {
		errJSON := fmt.Sprintf(`{"error": "Decoding error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	output, err := json.Marshal(model)
	if err != nil {
		errJSON := fmt.Sprintf(`{"error": "JSON marshal error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	return C.CString(string(output))
}

//export bysquare_free
func bysquare_free(ptr *C.char) {
	C.free(unsafe.Pointer(ptr))
}

//export bysquare_version
func bysquare_version() *C.char {
	return C.CString("0.1.0")
}

func main() {}

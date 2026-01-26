package main

/*
#include <stdlib.h>
*/
import "C"
import (
	"encoding/json"
	"fmt"
	"runtime/cgo"
	"unsafe"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// Config holds encoding configuration.
// Opaque to C callers, managed by Go.
//
// Thread-safety: Config instances are NOT thread-safe for concurrent modification.
// Callers must not modify the same config from multiple threads simultaneously.
// However, concurrent reads (multiple threads encoding with the same config) are safe.
// Callers must manually free the config using bysquare_free_config.
type Config struct {
	Deburr   bool
	Validate bool
	Version  bysquare.Version
}

//export bysquare_create_config
func bysquare_create_config() uintptr {
	// Create config with defaults
	cfg := &Config{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	// Use cgo.NewHandle to safely pass Go pointer to C
	handle := cgo.NewHandle(cfg)
	return uintptr(handle)
}

//export bysquare_free_config
func bysquare_free_config(handle uintptr) {
	// Delete the handle, allowing Go to garbage collect
	h := cgo.Handle(handle)
	h.Delete()
}

//export bysquare_config_set_deburr
func bysquare_config_set_deburr(handle uintptr, enabled C.int) {
	h := cgo.Handle(handle)
	if cfg, ok := h.Value().(*Config); ok {
		cfg.Deburr = enabled != 0
	}
}

//export bysquare_config_set_validate
func bysquare_config_set_validate(handle uintptr, enabled C.int) {
	h := cgo.Handle(handle)
	if cfg, ok := h.Value().(*Config); ok {
		cfg.Validate = enabled != 0
	}
}

//export bysquare_config_set_version
func bysquare_config_set_version(handle uintptr, version C.int) {
	h := cgo.Handle(handle)
	if cfg, ok := h.Value().(*Config); ok {
		// Validate version is within valid range (0-2)
		if version >= 0 && version <= 2 {
			cfg.Version = bysquare.Version(version)
		}
	}
}

//export bysquare_encode
func bysquare_encode(jsonData *C.char, cfgHandle uintptr) *C.char {
	input := C.GoString(jsonData)

	var model bysquare.DataModel
	if err := json.Unmarshal([]byte(input), &model); err != nil {
		errJSON := fmt.Sprintf(`{"error": "JSON parse error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	// Use defaults if config is NULL (0)
	opts := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	// Override with config if provided
	if cfgHandle != 0 {
		h := cgo.Handle(cfgHandle)
		if cfg, ok := h.Value().(*Config); ok {
			opts.Deburr = cfg.Deburr
			opts.Validate = cfg.Validate
			opts.Version = cfg.Version
		}
		// If type assertion fails, use defaults (already set)
	}

	result, err := bysquare.Encode(model, opts)
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

package main

/*
#include <stdlib.h>
#include <stdint.h>
*/
import "C"
import (
	"encoding/json"
	"fmt"
	"sync"
	"unsafe"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// Config holds encoding configuration.
// Opaque to C callers, managed by Go.
type Config struct {
	Deburr   bool
	Validate bool
	Version  bysquare.Version
}

var (
	// configRegistry tracks live config objects for safe memory management
	configRegistry = make(map[uintptr]*Config)
	configMutex    sync.RWMutex
	configCounter  uintptr
)

// registerConfig stores a config and returns an opaque handle
func registerConfig(cfg *Config) uintptr {
	configMutex.Lock()
	defer configMutex.Unlock()

	configCounter++
	handle := configCounter
	configRegistry[handle] = cfg

	return handle
}

// getConfig retrieves a config by handle
func getConfig(handle uintptr) *Config {
	configMutex.RLock()
	defer configMutex.RUnlock()

	return configRegistry[handle]
}

// unregisterConfig removes a config from the registry
func unregisterConfig(handle uintptr) {
	configMutex.Lock()
	defer configMutex.Unlock()

	delete(configRegistry, handle)
}

//export bysquare_create_config
func bysquare_create_config() C.uintptr_t {
	// Create config with defaults
	cfg := &Config{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	handle := registerConfig(cfg)
	return C.uintptr_t(handle)
}

//export bysquare_free_config
func bysquare_free_config(handle C.uintptr_t) {
	unregisterConfig(uintptr(handle))
}

//export bysquare_config_set_deburr
func bysquare_config_set_deburr(handle C.uintptr_t, enabled C.int) {
	cfg := getConfig(uintptr(handle))
	if cfg != nil {
		cfg.Deburr = enabled != 0
	}
}

//export bysquare_config_set_validate
func bysquare_config_set_validate(handle C.uintptr_t, enabled C.int) {
	cfg := getConfig(uintptr(handle))
	if cfg != nil {
		cfg.Validate = enabled != 0
	}
}

//export bysquare_config_set_version
func bysquare_config_set_version(handle C.uintptr_t, version C.int) {
	cfg := getConfig(uintptr(handle))
	if cfg != nil {
		cfg.Version = bysquare.Version(version)
	}
}

//export bysquare_encode
func bysquare_encode(jsonData *C.char, cfgHandle C.uintptr_t) *C.char {
	input := C.GoString(jsonData)

	var model bysquare.DataModel
	if err := json.Unmarshal([]byte(input), &model); err != nil {
		errJSON := fmt.Sprintf(`{"error": "JSON parse error: %s"}`, err.Error())
		return C.CString(errJSON)
	}

	// Get config from handle
	cfg := getConfig(uintptr(cfgHandle))
	if cfg == nil {
		errJSON := `{"error": "Invalid config handle"}`
		return C.CString(errJSON)
	}

	opts := bysquare.EncodeOptions{
		Deburr:   cfg.Deburr,
		Validate: cfg.Validate,
		Version:  cfg.Version,
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

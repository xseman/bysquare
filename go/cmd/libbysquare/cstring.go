package main

/*
#include <stdlib.h>
*/
import "C"

import "unsafe"

// cChar names C.char for the test file, which cannot import "C".
type cChar = C.char

// cString copies s onto the C heap; the caller frees it with freeString.
func cString(s string) *C.char { return C.CString(s) }

// goString copies a C string into Go memory.
func goString(p *C.char) string { return C.GoString(p) }

// freeString releases a string cString or the library returned.
func freeString(p *C.char) { C.free(unsafe.Pointer(p)) }

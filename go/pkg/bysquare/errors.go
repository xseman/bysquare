package bysquare

import "errors"

// ErrInvalidBase32Hex is what DecodeBase32Hex returns for input that is not
// base32hex.
var ErrInvalidBase32Hex = errors.New("invalid base32hex string")

// EncodeErrorMessage holds the messages an EncodeError carries; Extensions
// name the value that was wrong.
var EncodeErrorMessage = struct {
	BySquareType   string
	Version        string
	DocumentType   string
	Reserved       string
	HeaderDataSize string
}{
	BySquareType:   "Invalid BySquareType value in header, valid range <0,15>",
	Version:        "Invalid Version value in header",
	DocumentType:   "Invalid DocumentType value in header, valid range <0,15>",
	Reserved:       "Invalid Reserved value in header, valid range <0,15>",
	HeaderDataSize: "Allowed header data size exceeded",
}

// EncodeError is an input that cannot be encoded: a header nibble out of
// range or a payload past MaxCompressedSize. Extensions carry the offending
// values, as the TypeScript implementation's do.
type EncodeError struct {
	Message    string
	Extensions map[string]any
}

func (e *EncodeError) Error() string { return e.Message }

// DecodeErrorMessage holds the messages a DecodeError carries.
var DecodeErrorMessage = struct {
	MissingIBAN             string
	LZMADecompressionFailed string
	UnsupportedVersion      string
}{
	MissingIBAN:             "IBAN is missing",
	LZMADecompressionFailed: "LZMA decompression failed",
	UnsupportedVersion:      "Unsupported version",
}

// DecodeError is a QR string that does not decode: bad base32hex, a version
// this implementation does not know, a failed decompression or a checksum
// that does not match. Extensions carry the details, the wrapped cause
// among them under "error".
type DecodeError struct {
	Message    string
	Extensions map[string]any
}

func (e *DecodeError) Error() string { return e.Message }

// Unwrap exposes the cause stored under Extensions["error"], so errors.Is
// and errors.As see through a DecodeError.
func (e *DecodeError) Unwrap() error {
	if err, ok := e.Extensions["error"].(error); ok {
		return err
	}

	return nil
}

// ValidationError is a field that fails validation: Message explains what is
// wrong, Path leads to the field in the data model, as in
// "payments[0].bankAccounts[1].iban".
type ValidationError struct {
	Message string
	Path    string
}

func (e *ValidationError) Error() string {
	return e.Message + " (path: " + e.Path + ")"
}

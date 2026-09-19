package bysquare

import "errors"

// ErrInvalidBase32Hex indicates an invalid Base32Hex string.
var ErrInvalidBase32Hex = errors.New("invalid base32hex string")

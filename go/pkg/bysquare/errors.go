package bysquare

import "errors"

var (
	// ErrInvalidBase32Hex indicates an invalid Base32Hex string.
	ErrInvalidBase32Hex = errors.New("invalid base32hex string")

	// ErrMissingBankAccount indicates no bank accounts provided.
	ErrMissingBankAccount = errors.New("at least one bank account required")
)

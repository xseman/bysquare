// Package bysquare provides shared utilities for PAY by square and
// Invoice by square encoding and decoding.
//
// The packages [github.com/xseman/bysquare/go/pkg/bysquare/pay] and
// [github.com/xseman/bysquare/go/pkg/bysquare/invoice] hold the
// domain-specific types, encoding, decoding, and validation for each
// bysquare type. Their errors are defined here: a [*ValidationError], an
// [*EncodeError] or a [*DecodeError], matched with [errors.As], and
// [ErrInvalidBase32Hex], matched with [errors.Is].
package bysquare

// Version represents the BySquare format version.
type Version uint8

const (
	// Version100 - Created from original by square specifications.
	// Released Date: 2013-02-22
	Version100 Version = 0x00

	// Version110 - Added fields for beneficiary name and address.
	// Released Date: 2015-06-24
	Version110 Version = 0x01

	// Version120 - Beneficiary name is now a required field.
	// Released Date: 2025-04-01
	Version120 Version = 0x02
)

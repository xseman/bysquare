package bysquare

import (
	"encoding/base32"
	"strings"
)

// encodeBase32Hex encodes bytes to Base32Hex string using RFC 4648 extended hex alphabet.
//
// Uses the standard library encoding/base32.HexEncoding which implements the same
// base32hex alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV".
func encodeBase32Hex(input []byte, addPadding bool) string {
	enc := base32.HexEncoding
	if !addPadding {
		enc = enc.WithPadding(base32.NoPadding)
	}
	return enc.EncodeToString(input)
}

// decodeBase32Hex decodes Base32Hex string to bytes using RFC 4648 extended hex alphabet.
//
// Uses the standard library encoding/base32.HexEncoding with preprocessing for loose mode.
// Loose mode handles lowercase input and missing padding for QR code compatibility.
func decodeBase32Hex(input string, loose bool) ([]byte, error) {
	if len(input) == 0 {
		return []byte{}, nil
	}

	// Loose mode: normalize to uppercase and add padding if needed
	if loose {
		input = strings.ToUpper(input)
		paddingNeeded := (8 - (len(input) % 8)) % 8
		input += strings.Repeat("=", paddingNeeded)
	}

	// Determine encoder based on padding presence
	enc := base32.HexEncoding
	if !strings.Contains(input, "=") {
		enc = enc.WithPadding(base32.NoPadding)
	}

	result, err := enc.DecodeString(input)
	if err != nil {
		return nil, ErrInvalidBase32Hex
	}
	return result, nil
}

package bysquare

import (
	"strings"
)

const (
	base32HexChars = "0123456789ABCDEFGHIJKLMNOPQRSTUV"
	base32HexBits  = 5
	base32HexMask  = 0b11111
)

// encodeBase32Hex encodes bytes to Base32Hex string.
//
// Encodes bytes to base32hex by converting 8-bit bytes to 5-bit groups.
//
// Bit packing process (40 bits = 5 bytes → 8 base32hex chars):
//
//	Input bytes:     [   B0   ][   B1   ][   B2   ][   B3   ][   B4   ]
//	Bit positions:   76543210  76543210  76543210  76543210  76543210
//
//	Output groups:   [C0 ][C1 ][C2 ][C3 ][C4 ][C5 ][C6 ][C7 ]
//	Bit positions:   43210 43210 43210 43210 43210 43210 43210 43210
//
//	C0 = B0[7:3]   (top 5 bits of B0)
//	C1 = B0[2:0] + B1[7:6]   (bottom 3 bits of B0 + top 2 bits of B1)
//	C2 = B1[5:1]   (middle 5 bits of B1)
//	C3 = B1[0] + B2[7:4]   (bottom 1 bit of B1 + top 4 bits of B2)
//	... and so on
func encodeBase32Hex(input []byte, addPadding bool) string {
	if len(input) == 0 {
		return ""
	}

	var output strings.Builder
	var buffer uint32
	var bitsLeft int

	for _, b := range input {
		buffer = (buffer << 8) | uint32(b)
		bitsLeft += 8

		for bitsLeft >= base32HexBits {
			bitsLeft -= base32HexBits
			index := (buffer >> bitsLeft) & base32HexMask
			output.WriteByte(base32HexChars[index])
		}
	}

	// Handle remaining bits
	if bitsLeft > 0 {
		maskedValue := (buffer << (base32HexBits - bitsLeft)) & base32HexMask
		output.WriteByte(base32HexChars[maskedValue])
	}

	result := output.String()

	// Add padding if requested
	if addPadding {
		paddedLength := ((len(result) + 7) / 8) * 8
		result += strings.Repeat("=", paddedLength-len(result))
	}

	return result
}

// decodeBase32Hex decodes Base32Hex string to bytes.
//
// Decodes base32hex string back to bytes by converting 5-bit groups to 8-bit bytes.
//
// Bit unpacking process (8 base32hex chars → 5 bytes):
//
//	Input groups:    [C0 ][C1 ][C2 ][C3 ][C4 ][C5 ][C6 ][C7 ]
//	Bit positions:   43210 43210 43210 43210 43210 43210 43210 43210
//
//	Output bytes:    [   B0   ][   B1   ][   B2   ][   B3   ][   B4   ]
//	Bit positions:   76543210  76543210  76543210  76543210  76543210
//
//	B0 = C0[4:0] + C1[4:3]   (all of C0 + top 2 bits of C1)
//	B1 = C1[2:0] + C2[4:0]   (bottom 3 bits of C1 + all of C2)
//	B2 = C3[4:0] + C4[4:2]   (all of C3 + top 3 bits of C4)
//	... and so on
func decodeBase32Hex(input string, loose bool) ([]byte, error) {
	if len(input) == 0 {
		return []byte{}, nil
	}

	// Loose mode: handle lowercase and missing padding
	if loose {
		input = strings.ToUpper(input)
		paddingNeeded := (8 - (len(input) % 8)) % 8
		input += strings.Repeat("=", paddingNeeded)
	}

	// Remove padding
	input = strings.TrimRight(input, "=")

	output := make([]byte, 0, len(input)*5/8)
	var buffer uint32
	var bitsLeft int

	for i := 0; i < len(input); i++ {
		// Find character index
		index := strings.IndexByte(base32HexChars, input[i])
		if index == -1 {
			return nil, ErrInvalidBase32Hex
		}

		buffer = (buffer << base32HexBits) | uint32(index)
		bitsLeft += base32HexBits

		if bitsLeft >= 8 {
			bitsLeft -= 8
			output = append(output, byte((buffer>>bitsLeft)&0xFF))
		}
	}

	return output, nil
}

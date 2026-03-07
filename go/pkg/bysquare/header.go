package bysquare

import (
	"encoding/binary"
	"fmt"
	"strconv"
	"strings"
)

const (
	// MaxCompressedSize is the maximum allowed payload size (2^17).
	MaxCompressedSize = 131_072
)

// BysquareHeader represents parsed header fields.
type BysquareHeader struct {
	BySquareType uint8
	Version      uint8
	DocumentType uint8
	Reserved     uint8
}

// BuildBysquareHeader creates a 2-byte header.
//
//	Byte 0                  Byte 1
//	+----------+----------+----------+----------+
//	|   4 bit  |   4 bit  |   4 bit  |   4 bit  |
//	+----------+----------+----------+----------+
//	| BySqType | Version  | DocType  | Reserved |
//	| (0-15)   | (0-15)   | (0-15)   | (0-15)   |
//	+----------+----------+----------+----------+
//
// @see 3.5.
func BuildBysquareHeader(bySquareType, version, docType, reserved uint8) []byte {
	if bySquareType > 0x0F || version > 0x0F || docType > 0x0F || reserved > 0x0F {
		panic("header values must be 4-bit (0-15)")
	}

	header := make([]byte, 2)
	header[0] = (bySquareType << 4) | version
	header[1] = (docType << 4) | reserved

	return header
}

// ParseBysquareHeader extracts header fields from 2 bytes.
//
//	Byte 0                  Byte 1
//	+----------+----------+----------+----------+
//	|   4 bit  |   4 bit  |   4 bit  |   4 bit  |
//	+----------+----------+----------+----------+
//	| BySqType | Version  | DocType  | Reserved |
//	| (0-15)   | (0-15)   | (0-15)   | (0-15)   |
//	+----------+----------+----------+----------+
//
// @see 3.5.
func ParseBysquareHeader(header []byte) BysquareHeader {
	if len(header) < 2 {
		panic("header must be 2 bytes")
	}

	return BysquareHeader{
		BySquareType: (header[0] >> 4) & 0x0F,
		Version:      header[0] & 0x0F,
		DocumentType: (header[1] >> 4) & 0x0F,
		Reserved:     header[1] & 0x0F,
	}
}

// BuildPayloadLength creates a 2-byte little-endian length field.
//
//	+---------------+---------------+
//	|    Byte 0     |    Byte 1     |
//	+---------------+---------------+
//	|      LSB      |      MSB      |
//	+---------------+---------------+
//	| Little-endian 16-bit unsigned |
//	| max 2^17 = 131072             |
//	+-------------------------------+
//
// @see 3.6.
func BuildPayloadLength(length int) []byte {
	if length >= MaxCompressedSize {
		panic(fmt.Sprintf("payload length %d exceeds maximum %d", length, MaxCompressedSize))
	}

	buf := make([]byte, 2)
	binary.LittleEndian.PutUint16(buf, uint16(length))
	return buf
}

// Sanitize replaces tab characters in field values with space.
//
// @see 3.8.
func Sanitize(s string) string {
	return strings.ReplaceAll(s, "\t", " ")
}

// FormatFloat formats a float64 to string, omitting if zero.
// Use for optional numeric fields where zero means "not set".
func FormatFloat(f float64) string {
	if f == 0 {
		return ""
	}
	s := fmt.Sprintf("%f", f)
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return s
}

// FormatFloatRequired formats a float64 to string, always producing output
// even for zero. Use for required numeric fields where 0 is a valid value.
func FormatFloatRequired(f float64) string {
	s := fmt.Sprintf("%f", f)
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return s
}

// ParseNumber parses a string to int, returning 0 if empty or invalid.
func ParseNumber(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	return strconv.Atoi(s)
}

// ParseFloat parses a string to float64, returning 0 if empty or invalid.
func ParseFloat(s string) (float64, error) {
	if s == "" {
		return 0, nil
	}
	return strconv.ParseFloat(s, 64)
}

// AddChecksum prepends CRC32 checksum to payload.
//
//	+------------------+---------------------------+
//	|      4 bytes     |        Variable           |
//	+------------------+---------------------------+
//	| CRC32 Checksum   | Tab-separated payload     |
//	| (little-endian)  | (UTF-8 encoded)           |
//	+------------------+---------------------------+
//
// @see 3.10.
func AddChecksum(payload string) []byte {
	checksum := Crc32Checksum(payload)

	result := make([]byte, 4+len(payload))
	binary.LittleEndian.PutUint32(result[0:4], checksum)
	copy(result[4:], []byte(payload))

	return result
}

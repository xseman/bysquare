package bysquare

import "encoding/binary"

// MaxCompressedSize is the largest payload a header can describe: 2^17.
const MaxCompressedSize = 131_072

// Header is the four nibbles of the first two bytes.
type Header struct {
	BysquareType uint8
	Version      uint8
	DocumentType uint8
	Reserved     uint8
}

// BuildBysquareHeader returns the 2-byte header of the bysquare
// specification; a nibble outside 0-15 is an EncodeError.
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
func BuildBysquareHeader(bySquareType, version, documentType, reserved uint8) ([]byte, error) {
	for _, n := range []struct {
		value   uint8
		message string
	}{
		{bySquareType, EncodeErrorMessage.BySquareType},
		{version, EncodeErrorMessage.Version},
		{documentType, EncodeErrorMessage.DocumentType},
		{reserved, EncodeErrorMessage.Reserved},
	} {
		if n.value > 15 {
			return nil, &EncodeError{Message: n.message, Extensions: map[string]any{"invalidValue": n.value}}
		}
	}

	return []byte{bySquareType<<4 | version, documentType<<4 | reserved}, nil
}

// DecodeHeader extracts the four nibbles from a 2-byte header. A shorter
// input reads as zeros, the way the TypeScript implementation's does.
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
func DecodeHeader(header []byte) Header {
	var b0, b1 uint8
	if len(header) > 0 {
		b0 = header[0]
	}

	if len(header) > 1 {
		b1 = header[1]
	}

	return Header{
		BysquareType: b0 >> 4,
		Version:      b0 & 0x0F,
		DocumentType: b1 >> 4,
		Reserved:     b1 & 0x0F,
	}
}

// BuildPayloadLength is the 2-byte little-endian length of the compressed
// payload with its CRC32; a length of MaxCompressedSize or more is an
// EncodeError.
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
func BuildPayloadLength(length int) ([]byte, error) {
	if length >= MaxCompressedSize {
		return nil, &EncodeError{
			Message:    EncodeErrorMessage.HeaderDataSize,
			Extensions: map[string]any{"actualSize": length, "allowedSize": MaxCompressedSize},
		}
	}

	buf := make([]byte, 2)
	binary.LittleEndian.PutUint16(buf, uint16(length))

	return buf, nil
}

// AddChecksum prepends the payload's CRC32, little-endian.
//
//	+------------------+---------------------------+
//	|      4 bytes     |        Variable           |
//	+------------------+---------------------------+
//	| CRC32 Checksum   | Tab-separated payload     |
//	| (little-endian)  | (UTF-8 encoded)           |
//	+------------------+---------------------------+
//
// @see 3.10.
func AddChecksum(tabbedPayload string) []byte {
	result := make([]byte, 4+len(tabbedPayload))
	binary.LittleEndian.PutUint32(result[0:4], CRC32(tabbedPayload))
	copy(result[4:], tabbedPayload)

	return result
}

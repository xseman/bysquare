package bysquare

import (
	"bytes"
	"fmt"
	"io"

	"github.com/ulikunitz/xz/lzma"
)

// CompressLZMA compresses data using LZMA1 with custom settings.
//
// LZMA stream output (13-byte header + compressed body):
//
//	+---------------+---------------------------+-------------------+-----------+
//	|      1B       |           4B              |         8B        | Variable  |
//	+---------------+---------------------------+-------------------+-----------+
//	| Properties    | Dictionary Size           | Uncompressed Size | Body      |
//	| 0x5D          | 0x00020000 (2^17)         | (little-endian)   |           |
//	+---------------+---------------------------+-------------------+-----------+
//
// Properties byte: (pb * 5 + lp) * 9 + lc = (2 * 5 + 0) * 9 + 3 = 0x5D
//
// BySquare stores only the body (skips the 13-byte header)
//
// @see 3.11.
func CompressLZMA(data []byte) ([]byte, error) {
	var buf bytes.Buffer

	// Create LZMA writer with custom properties
	// Dictionary size: 2^17 = 131072
	config := lzma.WriterConfig{
		Properties: &lzma.Properties{
			LC: 3, // Literal context bits
			LP: 0, // Literal position bits
			PB: 2, // Position bits
		},
		DictCap: 131_072, // 2^17
		Size:    int64(len(data)),
	}

	writer, err := config.NewWriter(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create LZMA writer: %w", err)
	}

	if _, err := writer.Write(data); err != nil {
		return nil, fmt.Errorf("failed to write data: %w", err)
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close writer: %w", err)
	}

	return buf.Bytes(), nil
}

// DecompressLZMA decompresses LZMA data.
//
// The input is the LZMA body without the 13-byte header. The header must be
// reconstructed before the LZMA library can decompress:
//
//	+---------------+---------------------------+-------------------+
//	|      1B       |           4B              |         8B        |
//	+---------------+---------------------------+-------------------+
//	| Properties    | Dictionary Size           | Uncompressed Size |
//	| 0x5D          | 0x00020000 (2^17)         | (little-endian)   |
//	+---------------+---------------------------+-------------------+
//
// Properties byte: (pb * 5 + lp) * 9 + lc = (2 * 5 + 0) * 9 + 3 = 0x5D
//
// @see 3.11.
func DecompressLZMA(compressed []byte, uncompressedSize int) ([]byte, error) {
	header := make([]byte, 13)

	// Properties: 0x5D (lc=3, lp=0, pb=2)
	header[0] = 0x5D

	// Dictionary size: 2^17 = 0x00020000 (little-endian)
	header[1] = 0x00
	header[2] = 0x00
	header[3] = 0x02
	header[4] = 0x00

	// Uncompressed size (8 bytes, little-endian)
	header[5] = byte(uncompressedSize & 0xFF)
	header[6] = byte((uncompressedSize >> 8) & 0xFF)
	header[7] = byte((uncompressedSize >> 16) & 0xFF)
	header[8] = byte((uncompressedSize >> 24) & 0xFF)
	header[9] = 0x00
	header[10] = 0x00
	header[11] = 0x00
	header[12] = 0x00

	// Combine header with compressed data
	fullData := append(header, compressed...)

	// Create LZMA reader
	reader, err := lzma.NewReader(bytes.NewReader(fullData))
	if err != nil {
		return nil, fmt.Errorf("failed to create LZMA reader: %w", err)
	}

	// Read decompressed data
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, reader); err != nil {
		return nil, fmt.Errorf("failed to decompress: %w", err)
	}

	return buf.Bytes(), nil
}

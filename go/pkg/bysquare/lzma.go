package bysquare

import (
	"bytes"
	"fmt"
	"io"

	"github.com/ulikunitz/xz/lzma"
)

// compressLZMA compresses data using LZMA1 with custom settings.
//
// Settings match TypeScript implementation:
// - Dictionary size: 2^17 (131,072 bytes)
// - Literal context bits (lc): 3
// - Literal position bits (lp): 0
// - Position bits (pb): 2
//
// Returns the full LZMA stream including 13-byte header.
func compressLZMA(data []byte) ([]byte, error) {
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

// decompressLZMA decompresses LZMA data.
//
// The input compressed data does not include the 13-byte LZMA header.
// We need to reconstruct the header before decompression.
func decompressLZMA(compressed []byte, uncompressedSize int) ([]byte, error) {
	// Reconstruct LZMA header (13 bytes):
	// - Byte 0: Properties (1 byte): 0x5D (lc=3, lp=0, pb=2)
	// - Bytes 1-4: Dictionary size (4 bytes, little-endian): 0x00020000 (2^17)
	// - Bytes 5-12: Uncompressed size (8 bytes, little-endian)

	header := make([]byte, 13)

	// Properties: lc=3, lp=0, pb=2
	// Formula: (pb * 5 + lp) * 9 + lc = (2 * 5 + 0) * 9 + 3 = 93 = 0x5D
	header[0] = 0x5D

	// Dictionary size: 2^17 = 131072 = 0x00020000 (little-endian)
	header[1] = 0x00
	header[2] = 0x00
	header[3] = 0x02
	header[4] = 0x00

	// Uncompressed size (8 bytes, little-endian)
	// For sizes < 2^32, only first 4 bytes are used
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

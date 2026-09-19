// Package lzma is the LZMA1 framing the specification uses: lc=3, lp=0,
// pb=2, a 2^17 dictionary, and a stream whose 13-byte header the QR payload
// omits and Decompress puts back.
package lzma

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"slices"

	"github.com/ulikunitz/xz/lzma"
)

// Compress packs data as an LZMA1 stream (lc=3, lp=0, pb=2, 128 KiB
// dictionary), the 13-byte stream header included.
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
func Compress(data []byte) ([]byte, error) {
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

// Decompress unpacks a headerless LZMA1 body of the given uncompressed
// size, rebuilding the stream header the QR leaves out.
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
func Decompress(compressed []byte, uncompressedSize int) ([]byte, error) {
	header := make([]byte, 13)
	header[0] = 0x5D                                   // lc=3, lp=0, pb=2
	binary.LittleEndian.PutUint32(header[1:], 131_072) // dictionary size 2^17
	binary.LittleEndian.PutUint64(header[5:], uint64(uncompressedSize))

	fullData := slices.Concat(header, compressed)

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

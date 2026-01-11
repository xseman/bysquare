package bysquare

import "errors"

var (
	// ErrInvalidBase32Hex indicates an invalid Base32Hex string.
	ErrInvalidBase32Hex = errors.New("invalid base32hex string")

	// ErrInvalidHeader indicates an invalid BySquare header.
	ErrInvalidHeader = errors.New("invalid bysquare header")

	// ErrUnsupportedVersion indicates an unsupported format version.
	ErrUnsupportedVersion = errors.New("unsupported version")

	// ErrCompressionFailed indicates LZMA compression failed.
	ErrCompressionFailed = errors.New("compression failed")

	// ErrDecompressionFailed indicates LZMA decompression failed.
	ErrDecompressionFailed = errors.New("decompression failed")

	// ErrChecksumMismatch indicates CRC32 checksum validation failed.
	ErrChecksumMismatch = errors.New("CRC32 checksum mismatch")

	// ErrSerializationFailed indicates serialization failed.
	ErrSerializationFailed = errors.New("serialization failed")

	// ErrDeserializationFailed indicates deserialization failed.
	ErrDeserializationFailed = errors.New("deserialization failed")
)

package bysquare

import "hash/crc32"

// crc32Table uses the standard IEEE 802.3 polynomial (0xEDB88320).
var crc32Table = crc32.MakeTable(crc32.IEEE)

// crc32Checksum computes the CRC32 checksum of a string.
//
// Uses the standard CRC32 polynomial 0xEDB88320 (IEEE 802.3).
func crc32Checksum(data string) uint32 {
	return crc32.Checksum([]byte(data), crc32Table)
}

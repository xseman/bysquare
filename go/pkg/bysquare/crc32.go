package bysquare

import "hash/crc32"

var crc32Table = crc32.MakeTable(crc32.IEEE)

// CRC32 is the IEEE checksum of the string's UTF-8 bytes.
func CRC32(data string) uint32 {
	return crc32.Checksum([]byte(data), crc32Table)
}

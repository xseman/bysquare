package bysquare

import "hash/crc32"

// CRC32 is the IEEE checksum of the string's UTF-8 bytes.
func CRC32(data string) uint32 {
	return crc32.ChecksumIEEE([]byte(data))
}

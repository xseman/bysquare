import { CRC32_TABLE } from "lzma1";

/**
 * Computes the CRC32 checksum of a given string.
 */
export function crc32(data: string): number {
	let crc = 0 ^ (-1);
	const encoded = new TextEncoder().encode(data);

	for (let i = 0; i < encoded.length; i++) {
		crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ encoded[i]) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
}

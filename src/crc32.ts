// Precomputed CRC32 lookup table
const LOOKUP_TABLE = new Uint32Array(256);

for (let i = 0; i < LOOKUP_TABLE.length; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) {
		crc = (crc >>> 1) ^ (0xEDB88320 * (crc & 1));
	}
	LOOKUP_TABLE[i] = crc;
}

export function crc32(data: string): number {
	let crc = 0 ^ (-1);
	const encoded = new TextEncoder().encode(data);

	for (let i = 0; i < encoded.length; i++) {
		crc = (crc >>> 8) ^ LOOKUP_TABLE[(crc ^ encoded[i]) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
}

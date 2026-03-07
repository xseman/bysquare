import { crc32 } from "./crc32.js";

export const EncodeErrorMessage = {
	/**
	 * @description - find invalid value in extensions
	 */
	BySquareType: "Invalid BySquareType value in header, valid range <0,15>",

	/**
	 * @description - find invalid value in extensions
	 * @see {@link ./types#Version} for valid ranges
	 */
	Version: "Invalid Version value in header",

	/**
	 * @description - find invalid value in extensions
	 */
	DocumentType: "Invalid DocumentType value in header, valid range <0,15>",

	/**
	 * @description - find invalid value in extensions
	 */
	Reserved: "Invalid Reserved value in header, valid range <0,15>",

	/**
	 * @description - find actual size of header in extensions
	 * @see MAX_COMPRESSED_SIZE
	 */
	HeaderDataSize: "Allowed header data size exceeded",
} as const;

export class EncodeError extends Error {
	public extensions?: { [name: string]: any; };

	constructor(
		message: string,
		extensions?: { [name: string]: any; },
	) {
		super(message);
		this.name = this.constructor.name;

		if (extensions) {
			this.extensions = extensions;
		}
	}
}

export const DecodeErrorMessage = {
	MissingIBAN: "IBAN is missing",
	/**
	 * @description - find original LZMA error in extensions
	 */
	LZMADecompressionFailed: "LZMA decompression failed",
	/**
	 * @description - find found version in extensions
	 * @see {@link ./types#Version} for valid ranges
	 */
	UnsupportedVersion: "Unsupported version",
} as const;

export class DecodeError extends Error {
	public extensions?: { [name: string]: any; };

	constructor(
		message: string,
		extensions?: { [name: string]: any; },
	) {
		super(message);
		this.name = this.constructor.name;

		if (extensions) {
			this.extensions = extensions;
		}
	}
}

export interface Header {
	bysquareType: number;
	version: number;
	documentType: number;
	reserved: number;
}

export const MAX_COMPRESSED_SIZE = 131_072; // 2^17

/**
 * Returns a 2 byte buffer that represents the header of the bysquare
 * specification
 *
 * ```
 * Byte 0                  Byte 1
 * +----------+----------+----------+----------+
 * |   4 bit  |   4 bit  |   4 bit  |   4 bit  |
 * +----------+----------+----------+----------+
 * | BySqType | Version  | DocType  | Reserved |
 * | (0-15)   | (0-15)   | (0-15)   | (0-15)   |
 * +----------+----------+----------+----------+
 * ```
 *
 * @see 3.5.
 */
export function buildBysquareHeader(
	/** dprint-ignore */
	header: [
		bySquareType: number, version: number,
		documentType: number, reserved: number
	] = [
		0x00, 0x00,
		0x00, 0x00
	],
): number[] {
	if (header[0] < 0 || header[0] > 15) {
		throw new EncodeError(EncodeErrorMessage.BySquareType, { invalidValue: header[0] });
	}
	if (header[1] < 0 || header[1] > 15) {
		throw new EncodeError(EncodeErrorMessage.Version, { invalidValue: header[1] });
	}
	if (header[2] < 0 || header[2] > 15) {
		throw new EncodeError(EncodeErrorMessage.DocumentType, { invalidValue: header[2] });
	}
	if (header[3] < 0 || header[3] > 15) {
		throw new EncodeError(EncodeErrorMessage.Reserved, { invalidValue: header[3] });
	}

	const [
		bySquareType,
		version,
		documentType,
		reserved,
	] = header;

	// Combine 4-nibbles to 2-bytes
	const mergedNibbles = [
		(bySquareType << 4) | (version << 0),
		(documentType << 4) | (reserved << 0),
	];

	return mergedNibbles;
}

/**
 * Extracts the 4 nibbles from a 2-byte bysquare header using bit-shifting and
 * masking.
 *
 * ```
 * Byte 0                  Byte 1
 * +----------+----------+----------+----------+
 * |   4 bit  |   4 bit  |   4 bit  |   4 bit  |
 * +----------+----------+----------+----------+
 * | BySqType | Version  | DocType  | Reserved |
 * | (0-15)   | (0-15)   | (0-15)   | (0-15)   |
 * +----------+----------+----------+----------+
 * ```
 *
 * @param header 2-bytes size
 * @see 3.5.
 */
export function decodeHeader(header: Uint8Array): Header {
	const bytes = (header[0] << 8) | header[1];
	const bysquareType = bytes >> 12;
	const version = (bytes >> 8) & 0b0000_1111;
	const documentType = (bytes >> 4) & 0b0000_1111;
	const reserved = bytes & 0b0000_1111;

	return {
		bysquareType,
		version,
		documentType,
		reserved,
	};
}

/**
 * Creates a 2-byte array that represents the length of compressed data in
 * combination with CRC32 in bytes.
 *
 * ```
 * +---------------+---------------+
 * |    Byte 0     |    Byte 1     |
 * +---------------+---------------+
 * |      LSB      |      MSB      |
 * +---------------+---------------+
 * | Little-endian 16-bit unsigned |
 * | max 2^17 = 131072             |
 * +-------------------------------+
 * ```
 *
 * @see 3.6.
 */
export function buildPayloadLength(length: number): Uint8Array {
	if (length >= MAX_COMPRESSED_SIZE) {
		throw new EncodeError(EncodeErrorMessage.HeaderDataSize, {
			actualSize: length,
			allowedSize: MAX_COMPRESSED_SIZE,
		});
	}

	const header = new ArrayBuffer(2);
	new DataView(header).setUint16(0, length, true);

	return new Uint8Array(header);
}

/**
 * Prepends a 4-byte CRC32 checksum to the tab-separated payload.
 *
 * ```
 * +------------------+---------------------------+
 * |      4 bytes     |        Variable           |
 * +------------------+---------------------------+
 * | CRC32 Checksum   | Tab-separated payload     |
 * | (little-endian)  | (UTF-8 encoded)           |
 * +------------------+---------------------------+
 * ```
 *
 * @see 3.10.
 */
export function addChecksum(tabbedPayload: string): Uint8Array {
	const checksum = new ArrayBuffer(4);
	new DataView(checksum).setUint32(0, crc32(tabbedPayload), true);

	const byteArray = new TextEncoder().encode(tabbedPayload);

	return Uint8Array.from([
		...new Uint8Array(checksum),
		...Uint8Array.from(byteArray),
	]);
}

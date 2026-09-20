import * as lzma1 from "lzma1";

import {
	DecodeError,
	DecodeErrorMessage,
} from "./header.js";

/**
 * The LZMA stream header bysquare leaves out of the QR: the decoder rebuilds
 * it with a fixed dictionary size of 2^17, which always covers the match
 * distances of a QR sized payload.
 *
 * @see https://docs.fileformat.com/compression/lzma/
 *
 * +---------------+---------------------------+-------------------+
 * |      1B       |           4B              |         8B        |
 * +---------------+---------------------------+-------------------+
 * | Properties    | Dictionary Size           | Uncompressed Size |
 * +---------------+---------------------------+-------------------+
 */
const HEADER_SIZE = 13;

/**
 * Compresses the payload and returns the LZMA body without the 13-byte
 * stream header.
 *
 * @see 3.11.
 */
export function compress(data: Uint8Array): Uint8Array {
	return lzma1.compress(data).subarray(HEADER_SIZE);
}

/**
 * Decompresses a headerless LZMA body of the given uncompressed size.
 *
 * The decompressor needs the stream header to read the body, and bysquare
 * stores only the body, so the header is rebuilt first from the fixed
 * properties and the payload length the QR carries.
 *
 * @see 3.11.
 */
export function decompress(body: Uint8Array, uncompressedSize: number): Uint8Array {
	const header = new Uint8Array(HEADER_SIZE);
	const view = new DataView(header.buffer);
	header[0] = 0x5D; // lc=3, lp=0, pb=2
	view.setUint32(1, 131_072, true); // dictionary size 2^17
	view.setUint32(5, uncompressedSize, true); // bytes 9-12 stay 0 for sizes < 2^32

	let decompressed: Uint8Array | undefined;
	try {
		decompressed = lzma1.decompress(new Uint8Array([...header, ...body]));
	} catch (error) {
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, { error });
	}

	if (!decompressed) {
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, {
			error: "Decompression returned undefined",
		});
	}

	return decompressed;
}

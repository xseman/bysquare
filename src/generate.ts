import deburr from "lodash.deburr"
import * as lzma from "lzma-native"

import { Model, SequenceOrder, SUBST } from "./index"

// echo "Hello" | xz --format=raw --lzma1=lc=3,lp=0,pb=2,dict=32KiB --stdout | hexdump -C

/**
 * Returns a 2 byte buffer that represents the header of the bysquare
 * specification
 *
 * ```
 * | Attribute    | Number of bits | Possible values | Note
 * --------------------------------------------------------------------------------------------
 * | BySquareType | 4              | 0-15            | by square type
 * | Version      | 4              | 0-15            | version of the by square type
 * | DocumentType | 4              | 0-15            | document type within given by square type
 * | Reserved     | 4              | 0-15            | bits reserved for future needs
 * ```
 *
 * @see 3.5. by square header
 */
export function makeHeaderBysquare(
	header: [
		bySquareType: number, version: number,
		documentType: number, reserved: number
	] = [
			0b0000_0000, 0b0000_0000,
			0b0000_0000, 0b0000_0000
		]
): Buffer {
	const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15)
	if (!isValid) {
		throw new Error("Header range of values must be <0,15>")
	}
	const [
		bySquareType, version,
		documentType, reserved
	] = header

	/** Combine 4-nibbles to 2-bytes */
	const headerBuffer = Buffer.from([
		(bySquareType << 4) | (version << 0),
		(documentType << 4) | (reserved << 0)
	])

	return headerBuffer
}

/**
 * Allocates a new buffer of a 2 bytes that represents LZMA header which
 * contains 16-bit unsigned integer (word, little-endian), which is the size of
 * the decompressed data. Therefore the maximum size of compressed data is
 * limited to 65535
 *
 * @see 3.11. LZMA Compression
 */
function makeHeaderLzma(decompressedData: Buffer): Buffer {
	const bytesCount = decompressedData.length
	if (bytesCount >= 2 ** 16) {
		throw new Error("The maximum compressed data size has been reached")
	}

	const dataSize = Buffer.alloc(2)
	dataSize.writeInt16LE(bytesCount)
	return dataSize
}

/**
 * @see 3.10 Appending CRC32 checksum
 */
export function makeChecksum(tabbedInput: string): Buffer {
	// @ts-ignore: Wrong return type
	const data = lzma.crc32(tabbedInput) as number
	const crc32 = Buffer.alloc(4)
	crc32.writeUInt32LE(data)

	return crc32
}

/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10. Appending CRC32 checksum
 */
export function prepareForCompression(model: Model): Buffer {
	const tabbed: string = makeTabbed(model)
	return Buffer.concat([
		makeChecksum(tabbed),
		Buffer.from(tabbed, "utf-8")
	])
}

/**
 * Convert object to tab-separated fields according to the sequence specification
 *
 * @see Table 15 PAY by square sequence data model
 */
export function makeTabbed(model: Model): string {
	const tabbed = (Object.keys(model) as (keyof Model)[]).reduce(
		(acc, key) => {
			const index = SequenceOrder[key]

			/** Diacritical marks are not allowed */
			if (key === "PaymentNote") {
				acc[index] = deburr(model[key])
				return acc
			}

			acc[index] = String(model[key])
			return acc
		},
		Array<string | undefined>(33).fill(undefined)
	)

	const notStandingOrder = tabbed[14] === undefined
	const notDirectDebit = tabbed[19] === undefined

	if (notStandingOrder) {
		const attributesLength = 4
		tabbed[14] = String(0)
		tabbed.splice(15, attributesLength)

		if (notDirectDebit) {
			tabbed[19 - attributesLength] = String(0)
			tabbed.splice(20 - attributesLength, 10)
		}

		return tabbed.join("\t")
	}

	if (notDirectDebit) {
		const attributesLength = 10
		tabbed[19] = String(0)
		tabbed.splice(20, attributesLength)
	}

	return tabbed.join("\t")
}

/**
 * @see 3.13. Alphanumeric conversion using Base32hex
 */
export function alphanumericConversion(data: Buffer): string {
	let paddedBinString = data.reduce<string>(
		(acc, byte) => acc + byte.toString(2).padStart(8, "0"),
		""
	)
	let paddedLength = paddedBinString.length
	const remainder = paddedLength % 5
	if (remainder) {
		paddedBinString += Array(5 - remainder).fill("0").join("")
		paddedLength += 5 - remainder
	}

	/**
	 * Map a binary number of 5 bits to a string representation 2^5
	 * SUBST[0...32] represents char
	 *
	 * @see {@link SUBST}
	 */
	let encoded = ""
	for (let i = 0; i < paddedLength / 5; i++) {
		const binStart = 5 * i
		const binEnd = 5 * i + 5
		const sliced = paddedBinString.slice(binStart, binEnd)
		const key = parseInt(sliced, 2)
		encoded += SUBST[key]
	}

	return encoded
}

/**
 * Generate QR string ready for encoding into basic QR code
 */
export function generate(model: Model): Promise<string> {
	const data: Buffer = prepareForCompression(model)
	const compressedData: Buffer[] = []

	return new Promise<string>((resolve, reject) => {
		const encoder = lzma.createStream("rawEncoder", {
			synchronous: true,
			// @ts-ignore: Missing filter types
			filters: [{ id: lzma.FILTER_LZMA1 }]
		})

		encoder
			.on("data", (chunk: Buffer): void => {
				compressedData.push(chunk)
			})
			.on("error", reject)
			.on("end", (): void => {
				const output = Buffer.concat([
					makeHeaderBysquare(),
					makeHeaderLzma(data),
					...compressedData
				])

				const qr: string = alphanumericConversion(output)
				resolve(qr)
			})
			.write(data, (error): void => {
				error && reject(error)
				encoder.end()
			})
	})
}

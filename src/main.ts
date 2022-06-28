import lzma from "lzma-native"

import { Model, ModelOrdered } from "./schema"

/**
 * ```
 * | Attribute    | Number of bits | Possible values | Note
 * --------------------------------------------------------------------------------------------
 * | BySquareType | 4              | 0-15            | by square type
 * | Version      | 4              | 0-15            | version 4 0­15 version of the by sq
 * | DocumentType | 4              | 0-15            | document type within given by square type
 * | Reserved     | 4              | 0-15            | bits reserved for future needs
 * ```
 */
export function createHeader(
	// prettier-ignore
	header: [
		BySquareType: number, Version: number,
		DocumentType: number, Reserved: number
	] = [
		0b0000_0000, 0b0000_0000,
		0b0000_0000, 0b0000_0000
	]
): Buffer {
	const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15)
	if (!isValid) throw new Error()

	const [BySquareType, Version, DocumentType, Reserved] = header

	/** Combine 4-nibbles to 2-bytes */
	const headerBuffer = Buffer.from([
		(BySquareType << 4) | (Version << 0),
		(DocumentType << 4) | (Reserved << 0)
	])

	return headerBuffer
}

export function createChecksum(tabbedInput: string): Buffer {
	// @ts-ignore: Wrong return type
	const data = lzma.crc32(tabbedInput) as number
	const crc32 = Buffer.alloc(4)
	crc32.writeUInt32LE(data)

	return crc32
}

export function dataWithChecksum(model: Model): Buffer {
	const tabbedString = createTabbedString(model)
	const checksum = createChecksum(tabbedString)
	const merged: Buffer = Buffer.concat([
		checksum,
		Buffer.from(tabbedString, "utf-8")
	])

	return merged
}

/**
 * spec 3.13 (Table 9 – Encoding table)
 */
const SUBST = "0123456789ABCDEFGHIJKLMNOPQRSTUV"

export function generate(model: Model): Promise<string> {
	const dataBuffer: Buffer = dataWithChecksum(model)
	const dataChunks: Buffer[] = []

	return new Promise<string>((resolve, reject) => {
		const encoder = lzma.createStream("rawEncoder", {
			synchronous: true,
			// @ts-ignore: Missing filter types
			filters: [{ id: lzma.FILTER_LZMA1 }]
		})

		encoder
			.on("data", (chunk: Buffer): void => {
				dataChunks.push(chunk)
			})
			.on("error", Promise.reject)
			.on("end", () => {
				/**
				 * The header of compressed data is 2 bytes long and contains only
				 * one 16­bit unsigned integer (word, little­endian), which is the
				 * size of the decompressed data (spec 3.11)
				 */
				const size: Buffer = Buffer.alloc(2)
				size.writeInt16LE(dataBuffer.byteLength, 0)

				/** (spec 3.5) */
				const header = createHeader()

				/** Merged binary data (spec 3.15.) */
				const merged = Buffer.concat([
					header,
					size,
					Buffer.concat(dataChunks)
				])

				let paddedBinString = merged.reduce<string>(
					(acc, byte) => acc + byte.toString(2).padStart(8, "0"),
					""
				)

				let paddedBinLength = paddedBinString.length
				const remainder = paddedBinLength % 5
				if (remainder) {
					paddedBinString += Array(5 - remainder)
						.fill("0")
						.join("")

					paddedBinLength += 5 - remainder
				}

				/**
				 * Map a binary number of 5 bits to a string representation 2^5
				 * '0123456789ABCDEFGHIJKLMNOPQRSTUV'[0...32] represents char
				 */
				let output = ""
				for (let i = 0; i < paddedBinLength / 5; i++) {
					const binStart = 5 * i
					const binEnd = 5 * i + 5
					const slice = paddedBinString.slice(binStart, binEnd)
					const key = parseInt(slice, 2)
					output += SUBST[key]
				}

				return resolve(output)
			})
			.write(dataBuffer, (err): void => {
				err && reject(err)
				encoder.end()
			})
	})
}

export function createTabbedString(model: Model): string {
	/**
	 * Order keys by specification
	 * Fill empty values
	 * Transform to tabbed string
	 */
	const tabbedModel: string = (Object.keys(model) as (keyof Model)[])
		.reduce<string[]>((acc, key) => {
			acc[ModelOrdered[key]] = String(model[key] ?? "")
			return acc
		}, Array<string>(33).fill(""))
		.join("\t")

	return tabbedModel
}

export function createModel(tabbedString: string): Model {
	const model: Model = tabbedString
		.split("\t")
		.filter((ch) => !(ch === "\x00"))
		.reduce((acc, value, i) => {
			const key = ModelOrdered[i] as keyof Model

			if (value === "") {
				return acc
			}

			const numericKeys: (keyof Model)[] = [
				"Payments",
				"PaymentOptions",
				"Amount",
				"BankAccounts",
				"StandingOrderExt",
				"Day",
				"Month",
				"DirectDebitExt",
				"DirectDebitScheme",
				"DirectDebitType",
				"MaxAmount"
			]

			if (numericKeys.includes(key)) {
				acc[key] = Number(value)
				return acc
			}

			acc[key] = value
			return acc
		}, {} as any)

	return model
}

export function parse(qr: string): Promise<Model> {
	const binary: string = [...qr].reduce((acc, char) => {
		acc += SUBST.indexOf(char).toString(2).padStart(5, "0")
		return acc
	}, "")

	let bytes: number[] = []
	for (let nth = 0, leftCount = 0; binary.length > leftCount; nth++) {
		const byte = parseInt(binary.slice(leftCount, (leftCount += 8)), 2)
		bytes[nth] = byte
	}

	const input = Buffer.from(bytes)
	// const header = input.slice(0, 2)
	// const size = input.slice(2, 4)
	const data = input.slice(4)

	// @ts-ignore: Missing decored types
	const decoder = lzma.createStream("rawDecoder", {
		synchronous: true,
		// @ts-ignore: Missing filter types
		filters: [{ id: lzma.FILTER_LZMA1 }]
	})

	return new Promise<Model>((resolve, reject) => {
		decoder
			.on("error", reject)
			.on("data", (decompress: Buffer): void => {
				const checksum: Buffer = decompress.slice(0, 4)
				const data: string = decompress.slice(4).toString()

				// TODO: Not neccesary to validate, but data can be corrupted
				// if (!createChecksum(data).equals(checksum)) {
				// 	reject("Checksum conflict")
				// }

				const model = createModel(data)
				resolve(model)
			})
			.write(data, (err): void => {
				err && reject(err)
				decoder.end()
			})
	})
}

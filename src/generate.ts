import lzma from "lzma-native"

import { Model } from "."
import { createHeader, dataWithChecksum, SUBST } from "./utils"

function generate(model: Model): Promise<string> {
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
			.on("error", reject)
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
			.write(dataBuffer, (error): void => {
				if (error) {
					reject(error)
				}

				encoder.end()
			})
	})
}

export default generate

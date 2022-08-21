import lzma from "lzma-native"

import { Model } from "./types"
import { createModel, SUBST } from "./utils"

function parse(qr: string): Promise<Model> {
	const binary: string = [...qr].reduce((acc, char) => {
		acc += SUBST.indexOf(char).toString(2).padStart(5, "0")
		return acc
	}, "")

	let bytes: number[] = []
	for (let nth = 0, leftCount = 0; binary.length > leftCount; nth++) {
		/** string representation of 8xbits */
		const slice: string = binary.slice(leftCount, (leftCount += 8))
		const byte: number = parseInt(slice, 2)
		bytes[nth] = byte
	}

	const input = Buffer.from(bytes)
	// const header = inpEditorConfig.EditorConfigut.slice(0, 2)
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

export default parse

import * as lzma from "lzma-native"

import { Model, ModelOrdered } from "."
import { SUBST } from "./generate"

/**
 * Generating by square Code
 *
 * @see {spec 3.14.}
 */
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

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see {spec 3.16.}
 */
export function parse(qr: string): Promise<Model> {
	const inversed: Buffer = inverseAlphanumericConversion(qr)

	const headerBysquare = inversed.slice(0, 2)
	const headerCompression = inversed.slice(2, 4)
	const compressedData = inversed.slice(4)

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
				const _crc32: Buffer = decompress.slice(0, 4)
				const data = decompress.slice(4).toString()
				const model = createModel(data)

				resolve(model)
			})
			.write(compressedData, (error): void => {
				error && reject(error)
				decoder.end()
			})
	})
}

/**
 * Reverse alphanumeric conversion using Base32hex
 *
 * @see {spec 3.13.}
 */
export function inverseAlphanumericConversion(qr: string): Buffer {
	const binary: string = [...qr].reduce((acc, char) => {
		acc += SUBST.indexOf(char).toString(2).padStart(5, "0")
		return acc
	}, "")

	let bytes: number[] = []
	for (let nth = 0, leftCount = 0; binary.length > leftCount; nth++) {
		/** string representation of 8-bits */
		const slice: string = binary.slice(leftCount, (leftCount += 8))
		const byte: number = parseInt(slice, 2)
		bytes[nth] = byte
	}

	return Buffer.from(bytes)
}

/**
 * Simple binary header detector
 *
 * The Bysquare header is pretty useless, so the detection isn't as reliable as
 * I'd like
 */
export function detect(qr: string): boolean {
	const inversed: Buffer = inverseAlphanumericConversion(qr)
	if (inversed.byteLength < 2) {
		return false
	}

	const headerBysquare = inversed.slice(0, 2)
	return [...headerBysquare.toString("hex")]
		.map((nibble) => parseInt(nibble, 16))
		.every((nibble, index) => {
			// check version, actual v1.x.x
			if (index === 1) {
				return nibble <= 2
			}

			return 0 <= nibble && nibble <= 15
		})
}

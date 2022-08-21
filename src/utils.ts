import lzma from "lzma-native"

import { Model, ModelOrdered } from "./types"

/**
 * spec 3.13 (Table 9 – Encoding table)
 */
const SUBST = "0123456789ABCDEFGHIJKLMNOPQRSTUV"

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
function createHeader(
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

function createChecksum(tabbedInput: string): Buffer {
	// @ts-ignore: Wrong return type
	const data = lzma.crc32(tabbedInput) as number
	const crc32 = Buffer.alloc(4)
	crc32.writeUInt32LE(data)

	return crc32
}

function dataWithChecksum(model: Model): Buffer {
	const tabbedString = createTabbedString(model)
	const checksum = createChecksum(tabbedString)
	const merged: Buffer = Buffer.concat([
		checksum,
		Buffer.from(tabbedString, "utf-8")
	])

	return merged
}

/**
 * Order keys by specification
 * Fill empty values
 * Transform to tabbed string
 */
function createTabbedString(model: Model): string {
	const tabbedModel: string = (Object.keys(model) as (keyof Model)[])
		.reduce<string[]>((acc, key) => {
			acc[ModelOrdered[key]] = String(model[key] ?? "")
			return acc
		}, Array<string>(33).fill(""))
		.join("\t")

	return tabbedModel
}

function createModel(tabbedString: string): Model {
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

export {
	createChecksum,
	createHeader,
	createModel,
	createTabbedString,
	dataWithChecksum,
	SUBST
}

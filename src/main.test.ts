import { strict as assert } from "assert"
import lzma from "lzma-native"

import {
	createHeader,
	createModel,
	createTabbedString,
	generate,
	createChecksum,
	parse,
	dataWithChecksum
} from "./main"
import { Model } from "./schema"

const model: Model = {
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: 1,
	BankAccounts: 1
}

// prettier-ignore
const tabbedString = [
    "\t", "1",
    "\t", "1",
    "\t", "1", "0", "0",
    "\t", "E", "U", "R",
    "\t",
    "\t", "1", "2", "3",
    "\t", "\t", "\t", "\t",
    "\t", "1",
    "\t", "S", "K", "9", "6", "1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "2", "9", "1", "8", "5", "9", "9", "6", "6", "9",
    "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t", "\t"
].join("")

// prettier-ignore
const expectedQrString = "0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000"

export function createTabbedString_basic(): void {
	const expected: string = createTabbedString(model)
	assert.equal(tabbedString, expected)
}

export function dataWithChecksum_basic(): void {
	const expected = Buffer.from(
		"57e0bf34093109310931303009455552090931323309090909093109534b393631313030303030303030323931383539393636390909090909090909090909090909090909090909",
		"hex"
	)
	const created = dataWithChecksum(model)
	assert.deepEqual(created, expected)
}

export function createModel_basic(): void {
	const expected = createModel(tabbedString)
	assert.deepStrictEqual(model, expected)
}

export function createHeader_empty(): void {
	const created = createHeader()
	const expected = Buffer.from([0x0, 0x0])
	assert.deepEqual(created, expected)
}

export function createHeader_arg(): void {
	// prettier-ignore
	const created: Buffer = createHeader([
		0b0000_0001, 0b0000_0010,
		0b0000_0011, 0b0000_0100
	])
	// prettier-ignore
	const expected: Buffer = Buffer.from([
		0b0001_0010,
		0b0011_0100
	])

	assert.deepEqual(created, expected)
}

export function createChecksum_basic(): void {
	const expected: Buffer = Buffer.from([0x57, 0xe0, 0xbf, 0x34])
	const created: Buffer = createChecksum(tabbedString)

	assert.deepEqual(created, expected)
}

export async function generate_basic(): Promise<void> {
	const qrString = await generate(model)

	assert.equal(qrString, expectedQrString)
}

export async function generate_parse(): Promise<void> {
	const qrString = await generate(model)
	const parsed = await parse(qrString)

	assert.deepEqual(parsed, model)
}

export function lzma_compress_decompress(): void {
	const encoder = lzma.createStream("rawEncoder", {
		synchronous: true,
		// @ts-ignore: Missing filter types
		filters: [{ id: lzma.FILTER_LZMA1 }]
	})

	const message = "Hello"
	const compress = Buffer.from(message, "utf-8")
	const dataChunks: Buffer[] = []

	encoder
		.on("data", (data: Buffer): void => {
			dataChunks.push(data)
		})
		.write(compress, (error): void => {
			encoder.end()
		})

	encoder.on("end", (): void => {
		// @ts-ignore: Missing decored types
		const decoder = lzma.createStream("rawDecoder", {
			synchronous: true,
			// @ts-ignore: Missing filter types
			filters: [{ id: lzma.FILTER_LZMA1 }]
		})

		decoder
			.on("data", (res: Buffer): void => {
				const decoded = res.toString("utf-8")
				assert.equal(decoded, message)
			})
			.write(Buffer.concat(dataChunks), (error): void => {
				decoder.end()
			})
	})
}

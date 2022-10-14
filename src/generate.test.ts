import * as lzma from "lzma-native"
import { expect, test } from "vitest"

import { Model, generate, PaymentOptions } from "./"
import {
	createBysquareHeader,
	createChecksum,
	createTabbedString,
	dataWithChecksum
} from "./generate"

const model: Model = {
	InvoiceID: "random-id",
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: PaymentOptions.PAYMENTORDER,
	BankAccounts: 1
}

const tabbedString = [
	"random-id",
	"\t", "1",
	"\t", "1",
	"\t", "100",
	"\t", "EUR",
	"\t",
	"\t", "123",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t", "1",
	"\t", "SK9611000000002918599669",
	"\t",
	"\t", "0",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("")

test("Generate query-string from model", async () => {
	const base = await generate(model)
	expect(base).toEqual("0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0")
})

test("Create tabbed string from model", () => {
	const created = createTabbedString(model)
	expect(created).toEqual(tabbedString)
})

test("Create checksum", () => {
	const base: Buffer = Buffer.from([0x90, 0x94, 0x19, 0x21])
	const created: Buffer = createChecksum(tabbedString)

	expect(created).toStrictEqual(base)
})

test("Create data with checksum", () => {
	const checksum = dataWithChecksum(model)
	const base = Buffer.from(
		"9094192172616e646f6d2d6964093109310931303009455552090931323309090909093109534b393631313030303030303030323931383539393636390909300930090909",
		"hex"
	)

	expect(checksum).toStrictEqual(base)
})

test("Create binary header, default", () => {
	const created = createBysquareHeader()
	const base = Buffer.from([0x0, 0x0])

	expect(created).toStrictEqual(base)
})

test("Create binary header, args", () => {
	expect(createBysquareHeader([
		0b0000_0001, 0b0000_0010,
		0b0000_0011, 0b0000_0100
	])).toEqual(Buffer.from([
		0b0001_0010,
		0b0011_0100
	]))
})

test("Lzma testing", () => {
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
		.on("end", (): void => {
			// console.log(dataChunks);

			// @ts-ignore: Missing decored types
			const decoder = lzma.createStream("rawDecoder", {
				synchronous: true,
				// @ts-ignore: Missing filter types
				filters: [{ id: lzma.FILTER_LZMA1 }]
			})

			decoder
				.on("data", (res: Buffer): void => {
					const decoded = res.toString("utf-8")
					expect(decoded).toBe(message)
				})
				.write(Buffer.concat(dataChunks), (error): void => {
					decoder.end()
				})
		})
		.write(compress, (error): void => {
			encoder.end()
		})
})

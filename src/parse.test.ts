import { describe, expect, test } from "vitest"

import { detect, parse, ParsedModel } from "."
import { assemble } from "./parse"

const qr = "0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"

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

test("Parse model from qr-string", async () => {
	const parsed = await parse(qr)
	expect(parsed).toEqual({
		invoiceId: "random-id",
		payments: [
			{
				amount: 100,
				currencyCode: "EUR",
				variableSymbol: "123",
				bankAccounts: [{ iban: "SK9611000000002918599669" }]
			}
		]
	} as ParsedModel)
})

test("Create model from tabbed string", () => {
	const assembed = assemble(tabbedString)
	expect(assembed).toEqual({
		invoiceId: "random-id",
		payments: [
			{
				amount: 100,
				currencyCode: "EUR",
				variableSymbol: "123",
				bankAccounts: [{ iban: "SK9611000000002918599669" }]
			}
		]
	} as ParsedModel)
})

describe("Bysquare header detector", () => {
	test("Valid QR string", () => {
		const isBysquare = detect(qr)
		expect(isBysquare).toBeTruthy()
	})

	test("Invalid QR string", () => {
		const isBysquare = detect("")
		expect(isBysquare).toBeFalsy()
	})
})

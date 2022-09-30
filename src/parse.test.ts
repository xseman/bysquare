import { describe, expect, test } from "vitest"

import { Model, parse, detect } from "."

const qr = "0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"

test("Parse model from qr-string", async () => {
	const parsed = await parse(qr)
	const base: Model = {
		InvoiceID: 'random-id',
		IBAN: "SK9611000000002918599669",
		Amount: 100.0,
		CurrencyCode: "EUR",
		VariableSymbol: "123",
		Payments: 1,
		PaymentOptions: 1,
		BankAccounts: 1,
		StandingOrderExt: 0,
		DirectDebitExt: 0
	}

	expect(parsed).toStrictEqual(base)
})

describe("QR detector", () => {
	test("Detect valid QR", () => {
		const isBysquare = detect(qr)
		expect(isBysquare).toBeTruthy()
	})

	test("Empty string, should be invalid", () => {
		const isBysquare = detect("")
		expect(isBysquare).toBeFalsy()
	})
})

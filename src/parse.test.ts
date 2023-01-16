import { deepEqual, equal, throws } from 'node:assert/strict'
import { generate } from "./generate.js"

import { buildModel, detect, parse } from "./parse.js"
import { DataModel, PaymentOptions } from "./types.js"

const qr = "0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"
const qrData = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100,
			currencyCode: "EUR",
			variableSymbol: "123",
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			]
		}
	]
} satisfies DataModel


export async function parsing() {
	const parsed = await parse(qr)
	deepEqual(parsed, qrData)
}

export async function bidirectional() {
	const qr = await generate(qrData)
	const data = await parse(qr)
	deepEqual(qrData, data)
}

export function building() {
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

	const expected = buildModel(tabbedString)
	deepEqual(
		expected,
		{
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					amount: 100,
					currencyCode: "EUR",
					variableSymbol: "123",
					bankAccounts: [
						{ iban: "SK9611000000002918599669" }
					]
				}
			]
		} satisfies DataModel
	)
}

export function header() {
	const isBysquare = detect(qr)
	equal(isBysquare, true)

	const notBysquare = detect("EHIN6T0=" /** "hello" in base32hex */)
	equal(notBysquare, false)

	/** should throw, invalid base32hex */
	throws(() => detect("aaaa"))
	throws(() => detect("XXXX"))
}
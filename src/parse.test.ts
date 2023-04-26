import { deepEqual, equal, throws } from "node:assert/strict"
import { generate } from "./generate.js"
import { payload } from "./generate.test.js"

import { deserialize, detect, parse } from "./parse.js"
import { DataModel, PaymentOptions } from "./types.js"

export async function parsing() {
	const generated = generate(payload)
	const parsed = parse(generated)
	deepEqual(parsed, payload)
}

export function bidirectional() {
	const qrString = generate(payload)
	deepEqual(payload, parse(qrString))
}

export function serialization() {
	const serialized = /** dprint-ignore */ [
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

	const payload = {
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

	deepEqual(
		deserialize(serialized),
		payload
	)
}

export function header() {
	const generated = generate(payload)
	const isBysquare = detect(generated)
	equal(isBysquare, true)

	const notBysquare = detect("EHIN6T0=" /** "hello" in base32hex */)
	equal(notBysquare, false)

	/** should throw, invalid base32hex */
	throws(() => detect("aaaa"))
	throws(() => detect("XXXX"))
}

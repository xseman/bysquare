import { deepEqual, equal, throws } from "node:assert/strict"
import { generate } from "./generate.js"
import { payload } from "./generate.test.js"

import { deserialize, detect, parse } from "./parse.js"
import { CurrencyCode, DataModel, PaymentOptions } from "./types.js"

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
				currencyCode: CurrencyCode.EUR,
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

export function multipleData() {
	const data = new Map<string, DataModel>([
		[
			"0004I0006UC5LT8E21H3IC1K9R40P82GJL22NTU0586BBEOEKDMQSVUUBAOP1C0FFE14UJA1F1LJMV0FONE35J05TRC77FTIMV87NKNANNOFJB684000",
			{
				invoiceId: "2015001",
				payments: [{
					amount: 25.30,
					currencyCode: CurrencyCode.EUR,
					type: PaymentOptions.PaymentOrder,
					bankAccounts: [{ iban: "SK4523585719461382368397" }],
					beneficiary: { name: "John Doe" }
				}]
			}
		],
		[
			"00054000DG4GL2L1JL66N01P4GCBG05KQEPULNMP9EB7MEE935VG4P4B1BDBN7MV4GU13R7DMGU9O93QEI2KQJLPTFFU7GJNP6QL0UADVHOQ3B0OP0OO5P4L58M918PG00",
			{
				invoiceId: "2015001",
				payments: [{
					amount: 45.55,
					currencyCode: CurrencyCode.EUR,
					type: PaymentOptions.PaymentOrder,
					bankAccounts: [{ iban: "SK2738545237537948273958" }],
					beneficiary: { name: "Jane Doe" },
					paymentNote: "bendzín"
				}]
			}
		]
	])

	for (const [qr, parsed] of data) {
		deepEqual(parse(qr), parsed)
	}
}

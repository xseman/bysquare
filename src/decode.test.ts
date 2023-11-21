import assert from "node:assert";
import test, { describe } from "node:test";

import { decode, deserialize, detect } from "./decode.js";
import { encode } from "./encode.js";
import { CurrencyCode, DataModel, PaymentOptions } from "./types.js";

export const payload = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
} satisfies DataModel;

describe("parse", () => {
	test("parsing", () => {
		const encoded = encode(payload);
		const decoded = decode(encoded);
		assert.deepEqual(decoded, payload);
	});

	test("bidirectional", () => {
		const qrString = encode(payload);
		assert.deepEqual(payload, decode(qrString));
	});

	test("serialization", () => {
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
		].join("");

		const payload = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					amount: 100,
					currencyCode: CurrencyCode.EUR,
					variableSymbol: "123",
					bankAccounts: [
						{ iban: "SK9611000000002918599669" },
					],
				},
			],
		} satisfies DataModel;

		assert.deepEqual(
			deserialize(serialized),
			payload,
		);
	});

	test("header", () => {
		const encoded = encode(payload);
		const isBysquare = detect(encoded);
		assert.equal(isBysquare, true);

		const notBysquare = detect("EHIN6T0=" /** "hello" in base32hex */);
		assert.equal(notBysquare, false);

		/** should throw, invalid base32hex */
		assert.throws(() => detect("aaaa"));
		assert.throws(() => detect("XXXX"));
	});

	test("multiple data", () => {
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
						beneficiary: { name: "John Doe" },
					}],
				},
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
						paymentNote: "bendzín",
					}],
				},
			],
		]);

		for (const [qr, encoded] of data) {
			const decoded = decode(qr);
			assert.deepEqual(decoded, encoded);
		}
	});
});

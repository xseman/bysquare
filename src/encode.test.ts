import assert from "node:assert";
import test from "node:test";

import { decode } from "./decode.js";
import {
	addChecksum,
	encode,
	headerBysquare,
	serialize,
} from "./encode.js";
import {
	CurrencyCode,
	DataModel,
	PaymentOptionsFlag,
} from "./types.js";

export const payload = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptionsFlag.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
} satisfies DataModel;

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

test("encode", () => {
	const encoded = encode(payload);
	const decoded = decode(encoded);
	assert.deepStrictEqual(payload, decoded);
});

test("encode - serialize", () => {
	const created = serialize(payload);
	assert.equal(created, serialized);
});

test("encode - create data with checksum", () => {
	const checksum = addChecksum(serialized);
	/** dprint-ignore */
	const expected = Uint8Array.from([0x90, 0x94, 0x19, 0x21, 0x72, 0x61, 0x6e, 0x64, 0x6f, 0x6d, 0x2d, 0x69, 0x64, 0x09, 0x31, 0x09, 0x31, 0x09, 0x31, 0x30, 0x30, 0x09, 0x45, 0x55, 0x52, 0x09, 0x09, 0x31, 0x32, 0x33, 0x09, 0x09, 0x09, 0x09, 0x09, 0x31, 0x09, 0x53, 0x4b, 0x39, 0x36, 0x31, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x39, 0x31, 0x38, 0x35, 0x39, 0x39, 0x36, 0x36, 0x39, 0x09, 0x09, 0x30, 0x09, 0x30, 0x09, 0x09, 0x09]);
	assert.deepEqual(checksum, expected);
});

test("encode - make bysquare header", () => {
	const header = headerBysquare();
	const expected = Uint8Array.from([0x00, 0x00]);
	assert.deepEqual(header, expected);
});

test("encode - binary header", () => {
	assert.deepEqual(
		headerBysquare(/** dprint-ignore */ [
				0b0000_0001, 0b0000_0010,
				0b0000_0011, 0b0000_0100,
			]),
		Uint8Array.from([
			0b0001_0010,
			0b0011_0100,
		]),
	);
});

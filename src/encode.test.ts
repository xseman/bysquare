import assert from "node:assert";
import test, { describe } from "node:test";

import { decode } from "./decode.js";
import {
	addChecksum,
	encode,
	EncodeError,
	EncodeErrorMessage,
	headerBysquare,
	headerDataLength,
	MAX_COMPRESSED_SIZE,
	removeDiacritics,
	serialize,
} from "./encode.js";
import {
	payloadWithDirectDebit,
	payloadWithPaymentOrder,
	payloadWithStandingOrder,
	serializedDirectDebit,
	serializedPaymentOrder,
	serializedStandingOrder,
} from "./test_assets.js";
import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
	Version,
} from "./types.js";

test("encode", () => {
	const encoded = encode(payloadWithPaymentOrder);
	const decoded = decode(encoded);
	assert.deepStrictEqual(payloadWithPaymentOrder, decoded);
});

describe("encode - serialize", () => {
	test("serializes a payment order", () => {
		const created = serialize(payloadWithPaymentOrder);
		assert.equal(created, serializedPaymentOrder);
	});
	test("serializes a standing order", () => {
		const created = serialize(payloadWithStandingOrder);
		assert.equal(created, serializedStandingOrder);
	});
	test("serializes a direct debit", () => {
		const created = serialize(payloadWithDirectDebit);
		assert.equal(created, serializedDirectDebit);
	});
});

test("encode - create data with checksum", () => {
	const checksum = addChecksum(serializedPaymentOrder);
	/** dprint-ignore */
	const expected = Uint8Array.from([0x90, 0x94, 0x19, 0x21, 0x72, 0x61, 0x6e, 0x64, 0x6f, 0x6d, 0x2d, 0x69, 0x64, 0x09, 0x31, 0x09, 0x31, 0x09, 0x31, 0x30, 0x30, 0x09, 0x45, 0x55, 0x52, 0x09, 0x09, 0x31, 0x32, 0x33, 0x09, 0x09, 0x09, 0x09, 0x09, 0x31, 0x09, 0x53, 0x4b, 0x39, 0x36, 0x31, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x39, 0x31, 0x38, 0x35, 0x39, 0x39, 0x36, 0x36, 0x39, 0x09, 0x09, 0x30, 0x09, 0x30, 0x09, 0x09, 0x09]);
	assert.deepEqual(checksum, expected);
});

describe("encode - headerBysquare", () => {
	test("make bysquare header", () => {
		const header = headerBysquare();
		const expected = Uint8Array.from([0x00, 0x00]);
		assert.deepEqual(header, expected);
	});
	test("make bysquare header from binary data", () => {
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
	test("throw EncodeError when creating an bysquare header with invalid type", () => {
		const invalidValue = 0x1F;
		assert.throws(() => {
			headerBysquare([invalidValue, Version["1.0.0"], 0x00, 0x00]);
		}, new EncodeError(EncodeErrorMessage.BySquareType, { invalidValue }));
	});
	test("throw EncodeError when creating an bysquare header with invalid version", () => {
		const invalidValue = 0xFF;
		assert.throws(() => {
			headerBysquare([0x00, invalidValue, 0x00, 0x00]);
		}, new EncodeError(EncodeErrorMessage.Version, { invalidValue }));
	});
	test("throw EncodeError when creating an bysquare header with invalid document type", () => {
		const invalidValue = 0xFF;
		assert.throws(() => {
			headerBysquare([0x00, 0x00, invalidValue, 0x00]);
		}, new EncodeError(EncodeErrorMessage.DocumentType, { invalidValue }));
	});
	test("throw EncodeError when creating an bysquare header with invalid reserved nibble", () => {
		const invalidValue = 0xFF;
		assert.throws(() => {
			headerBysquare([0x00, 0x00, 0x00, invalidValue]);
		}, new EncodeError(EncodeErrorMessage.Reserved, { invalidValue }));
	});
});

describe("encode - headerDataLength", () => {
	test("return encoded header data length", () => {
		const length = MAX_COMPRESSED_SIZE - 1;
		const dataView = new DataView(new ArrayBuffer(2));
		dataView.setUint16(0, length, true);
		assert.deepEqual(
			headerDataLength(length),
			new Uint8Array(dataView.buffer),
		);
	});
	test("throw EncodeError, when allowed size of header is exceeded", () => {
		assert.throws(
			() => {
				headerDataLength(MAX_COMPRESSED_SIZE);
			},
			new EncodeError(EncodeErrorMessage.HeaderDataSize, {
				actualSize: MAX_COMPRESSED_SIZE,
				allowedSize: MAX_COMPRESSED_SIZE,
			}),
		);
	});
});

describe("encode - removeDiacritics", function() {
	const payloadWithDiacritics = {
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
				paymentNote: "Príspevok na kávu",
				beneficiary: {
					name: "Ján Kováč",
					city: "Košice",
					street: "Štúrova 27",
				},
			},
		],
	} satisfies DataModel;
	test("Removes diacritics from payload", function() {
		const input = Object.assign(
			{},
			JSON.parse(JSON.stringify(payloadWithDiacritics)),
		) satisfies DataModel;
		removeDiacritics(input);
		assert.deepEqual(input, {
			...payloadWithDiacritics,
			payments: [{
				...payloadWithDiacritics.payments[0],
				paymentNote: "Prispevok na kavu",
				beneficiary: {
					name: "Jan Kovac",
					city: "Kosice",
					street: "Sturova 27",
				},
			}],
		});
	});
});

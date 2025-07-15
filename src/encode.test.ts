import {
	describe,
	expect,
	test,
} from "bun:test";

import * as base32hex from "./base32hex.js";
import { deserialize } from "./decode.js";
import {
	addChecksum,
	buildBysquareHeader,
	buildPayloadLength,
	encode,
	EncodeError,
	EncodeErrorMessage,
	MAX_COMPRESSED_SIZE,
	removeDiacritics,
	serialize,
} from "./encode.js";
import {
	expectedPaymentOrderWithoutDiacritics,
	payloadWithDirectDebit,
	payloadWithPaymentOrder,
	payloadWithStandingOrder,
	paymentOrderWithDiacritics,
	serializedDirectDebit,
	serializedPaymentOrder,
	serializedStandingOrder,
} from "./testdata/index.js";
import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
	Version,
} from "./types.js";

describe("encode", () => {
	test("basic encoding", () => {
		const encoded = encode(payloadWithPaymentOrder);

		expect(typeof encoded).toBe("string");
		expect(encoded.length).toBeGreaterThan(0);
		expect(encoded.startsWith("00")).toBe(true);

		// Verify it can be base32hex decoded without errors
		const decoded = base32hex.decode(encoded);
		expect(decoded.length).toBeGreaterThanOrEqual(4); // At least header + length bytes
	});

	test("serialize and deserialize round trip", () => {
		const testData = {
			payments: [{
				amount: 25.3,
				currencyCode: CurrencyCode.EUR,
				type: PaymentOptions.PaymentOrder,
				bankAccounts: [{ iban: "SK4523585719461382368397" }],
				beneficiary: { name: "John Doe" },
			}],
		} satisfies DataModel;

		const serialized = serialize(testData);
		const deserialized = deserialize(serialized);

		expect(deserialized.payments.length).toBe(1);
		expect(deserialized.payments[0].amount).toBe(testData.payments[0].amount);
		expect(deserialized.payments[0].currencyCode).toBe(testData.payments[0].currencyCode);
		expect(deserialized.payments[0].type).toBe(testData.payments[0].type);
		expect(deserialized.payments[0].bankAccounts[0].iban).toBe(
			testData.payments[0].bankAccounts[0].iban,
		);
		expect(deserialized.payments[0].beneficiary?.name).toBe(
			testData.payments[0].beneficiary?.name,
		);
	});
});

describe("encode - serialize", () => {
	test("serializes a payment order", () => {
		const created = serialize(payloadWithPaymentOrder);
		expect(created).toBe(serializedPaymentOrder);
	});

	test("serializes a standing order", () => {
		const created = serialize(payloadWithStandingOrder);
		expect(created).toBe(serializedStandingOrder);
	});

	test("serializes a direct debit", () => {
		const created = serialize(payloadWithDirectDebit);
		expect(created).toBe(serializedDirectDebit);
	});
});

describe("encode - checksum", () => {
	test("create data with checksum", () => {
		const expected = Uint8Array.from([
			0x90,
			0x94,
			0x19,
			0x21,
			0x72,
			0x61,
			0x6e,
			0x64,
			0x6f,
			0x6d,
			0x2d,
			0x69,
			0x64,
			0x09,
			0x31,
			0x09,
			0x31,
			0x09,
			0x31,
			0x30,
			0x30,
			0x09,
			0x45,
			0x55,
			0x52,
			0x09,
			0x09,
			0x31,
			0x32,
			0x33,
			0x09,
			0x09,
			0x09,
			0x09,
			0x09,
			0x31,
			0x09,
			0x53,
			0x4b,
			0x39,
			0x36,
			0x31,
			0x31,
			0x30,
			0x30,
			0x30,
			0x30,
			0x30,
			0x30,
			0x30,
			0x30,
			0x32,
			0x39,
			0x31,
			0x38,
			0x35,
			0x39,
			0x39,
			0x36,
			0x36,
			0x39,
			0x09,
			0x09,
			0x30,
			0x09,
			0x30,
			0x09,
			0x09,
			0x09,
		]);

		const checksum = addChecksum(serializedPaymentOrder);
		expect(checksum).toEqual(expected);
	});
});

describe("encode - buildBysquareHeader", () => {
	test("make bysquare header", () => {
		const expected = [0x00, 0x00];
		const header = buildBysquareHeader();
		expect(header).toEqual(expected);
	});

	test("make bysquare header from binary data", () => {
		const inputData: [number, number, number, number] = [
			0b0000_0001,
			0b0000_0010,
			0b0000_0011,
			0b0000_0100,
		];
		const expected = [0b0001_0010, 0b0011_0100];

		const result = buildBysquareHeader(inputData);

		expect(result).toEqual(expected);
	});

	test("throw EncodeError when creating an bysquare header with invalid type", () => {
		const invalidValue = 0xFF;

		expect(() => {
			buildBysquareHeader([invalidValue, Version["1.0.0"], 0x00, 0x00]);
		}).toThrow(new EncodeError(EncodeErrorMessage.BySquareType, { invalidValue }));
	});

	test("throw EncodeError when creating an bysquare header with invalid version", () => {
		const invalidValue = 0xFF;

		expect(() => {
			buildBysquareHeader([0x00, invalidValue, 0x00, 0x00]);
		}).toThrow(new EncodeError(EncodeErrorMessage.Version, { invalidValue }));
	});

	test("throw EncodeError when creating an bysquare header with invalid document type", () => {
		const invalidValue = 0xFF;

		expect(() => {
			buildBysquareHeader([0x00, 0x00, invalidValue, 0x00]);
		}).toThrow(new EncodeError(EncodeErrorMessage.DocumentType, { invalidValue }));
	});

	test("throw EncodeError when creating an bysquare header with invalid reserved nibble", () => {
		const invalidValue = 0xFF;

		expect(() => {
			buildBysquareHeader([0x00, 0x00, 0x00, invalidValue]);
		}).toThrow(new EncodeError(EncodeErrorMessage.Reserved, { invalidValue }));
	});
});

describe("encode - buildPayloadLength", () => {
	test("return encoded header data length", () => {
		const length = MAX_COMPRESSED_SIZE - 1;
		const dataView = new DataView(new ArrayBuffer(2));
		dataView.setUint16(0, length, true);
		const expected = new Uint8Array(dataView.buffer);

		const result = buildPayloadLength(length);

		expect(result).toEqual(expected);
	});

	test("throw EncodeError when allowed size of header is exceeded", () => {
		const maxSize = MAX_COMPRESSED_SIZE;

		expect(() => {
			buildPayloadLength(maxSize);
		}).toThrow(
			new EncodeError(EncodeErrorMessage.HeaderDataSize, {
				actualSize: maxSize,
				allowedSize: maxSize,
			}),
		);
	});
});

describe("encode - removeDiacritics", () => {
	test("Removes diacritics from payload", () => {
		const input = Object.assign(
			{},
			JSON.parse(JSON.stringify(paymentOrderWithDiacritics)),
		) satisfies DataModel;

		removeDiacritics(input);

		expect(input).toEqual(expectedPaymentOrderWithoutDiacritics);
	});
});

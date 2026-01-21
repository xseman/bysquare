/**
 * Tests for the encode module.
 *
 * Covers:
 * - Basic encoding of payment orders, standing orders, and direct debits
 * - Serialization to tab-separated format
 * - Header creation and checksum calculation
 * - Diacritics removal (deburr)
 * - Error handling for invalid inputs
 * - Property-based tests for encoding consistency
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { decode } from "./decode.js";
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
	buildDataModel,
	buildPaymentOrder,
	DIRECT_DEBIT_DATA,
	DIRECT_DEBIT_FIXTURE,
	DIRECT_DEBIT_SERIALIZED,
	MINIMAL_PAYMENT,
	PAYMENT_ORDER_FIXTURE,
	PAYMENT_ORDER_SERIALIZED,
	PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE,
	PAYMENT_ORDER_WITHOUT_DIACRITICS_EXPECTED,
	STANDING_ORDER_DATA,
	STANDING_ORDER_FIXTURE,
	STANDING_ORDER_SERIALIZED,
	TEST_IBANS,
	VALID_PAYMENT_ORDER,
} from "./testdata/index.js";
import {
	CurrencyCode,
	Version,
} from "./types.js";

describe("encode basic functionality", () => {
	test("encodes valid payment order", () => {
		const result = encode(VALID_PAYMENT_ORDER);

		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
		expect(result.startsWith("08")).toBe(true);
	});

	test("encodes minimal payment", () => {
		const result = encode(MINIMAL_PAYMENT);

		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("encodes standing order", () => {
		const result = encode(STANDING_ORDER_DATA);

		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("encodes direct debit", () => {
		const result = encode(DIRECT_DEBIT_DATA);

		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("encodes with Version 1.2.0 by default", () => {
		const result = encode(MINIMAL_PAYMENT);

		expect(result).toBeDefined();
		expect(result.startsWith("08")).toBe(true);
	});

	test("encodes with Version 1.1.0 when specified", () => {
		const result = encode(MINIMAL_PAYMENT, { version: Version["1.1.0"] });
		const decoded = decode(result);

		expect(result).toBeDefined();
		expect(result.startsWith("04")).toBe(true);
		expect(decoded.payments).toHaveLength(1);
	});
});

describe("encode error cases", () => {
	test("invalid IBAN in bank account", () => {
		const data = buildDataModel({
			payments: [buildPaymentOrder({
				bankAccounts: [{ iban: "INVALID" }],
			})],
		});

		expect(() => encode(data)).toThrow();
	});
});

describe("encode property based", () => {
	test("encode always returns valid base32hex string", () => {
		const validIbans = [
			TEST_IBANS.SK_VALID,
			TEST_IBANS.CZ_VALID,
			TEST_IBANS.AT_VALID,
		];

		const validCurrencies = [CurrencyCode.EUR, CurrencyCode.USD, CurrencyCode.CZK];

		for (let i = 0; i < 50; i++) {
			const randomData = buildDataModel({
				invoiceId: `test-${i}`,
				payments: [buildPaymentOrder({
					amount: Math.round(Math.random() * 10_000) / 100,
					variableSymbol: String(Math.floor(Math.random() * 999_999)),
					currencyCode:
						validCurrencies[Math.floor(Math.random() * validCurrencies.length)],
					bankAccounts: [{
						iban: validIbans[Math.floor(Math.random() * validIbans.length)],
					}],
				})],
			});

			const encoded = encode(randomData);

			expect(typeof encoded).toBe("string");
			expect(encoded.length).toBeGreaterThan(0);
			expect(/^[0-9A-Z]+$/i.test(encoded)).toBe(true);
		}
	});
});

describe("encode serialization", () => {
	test("serializes payment order", () => {
		const result = serialize(PAYMENT_ORDER_FIXTURE);
		expect(result).toBe(PAYMENT_ORDER_SERIALIZED);
	});

	test("serializes standing order", () => {
		const result = serialize(STANDING_ORDER_FIXTURE);
		expect(result).toBe(STANDING_ORDER_SERIALIZED);
	});

	test("serializes direct debit", () => {
		const result = serialize(DIRECT_DEBIT_FIXTURE);
		expect(result).toBe(DIRECT_DEBIT_SERIALIZED);
	});
});

describe("addChecksum", () => {
	test("returns Uint8Array with correct length", () => {
		const payload = "test\tpayload";
		const payloadBytes = new TextEncoder().encode(payload).length;

		const result = addChecksum(payload);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.byteLength).toBe(4 + payloadBytes);
	});

	test("first 4 bytes contain CRC32 checksum", () => {
		const payload = "test\tpayload";

		const result = addChecksum(payload);
		const checksumBytes = result.slice(0, 4);
		const checksum = new DataView(checksumBytes.buffer, checksumBytes.byteOffset, 4)
			.getUint32(0, true);

		expect(checksum).toBeGreaterThan(0);
		expect(checksum).toBeLessThanOrEqual(4_294_967_295);
	});

	test("remaining bytes match UTF-8 encoded input", () => {
		const payload = "test\tpayload";
		const expectedPayloadBytes = new TextEncoder().encode(payload);

		const result = addChecksum(payload);
		const payloadBytes = result.slice(4);

		expect(payloadBytes).toEqual(expectedPayloadBytes);
	});

	test("handles empty string", () => {
		const payload = "";

		const result = addChecksum(payload);

		expect(result.byteLength).toBe(4);
		expect(result.slice(4)).toEqual(new Uint8Array([]));
	});

	test("handles unicode characters", () => {
		const payload = "Žltý kôň úpel ďábelské ódy";
		const payloadBytes = new TextEncoder().encode(payload).length;

		const result = addChecksum(payload);

		expect(result.byteLength).toBe(4 + payloadBytes);
		const decodedPayload = new TextDecoder().decode(result.slice(4));
		expect(decodedPayload).toBe(payload);
	});

	test("different payloads produce different checksums", () => {
		const payload1 = "test1";
		const payload2 = "test2";

		const result1 = addChecksum(payload1);
		const result2 = addChecksum(payload2);

		const checksum1 = new DataView(result1.buffer, result1.byteOffset, 4)
			.getUint32(0, true);
		const checksum2 = new DataView(result2.buffer, result2.byteOffset, 4)
			.getUint32(0, true);

		expect(checksum1).not.toBe(checksum2);
	});
});

describe("encode header building", () => {
	test("builds bysquare header", () => {
		const expected = [0x00, 0x00];
		const result = buildBysquareHeader();
		expect(result).toEqual(expected);
	});

	test("builds bysquare header from binary data", () => {
		/** dprint-ignore - formátovanie binárnych dát */
		const inputData = [
			0b0000_0001, 0b0000_0010,
			0b0000_0011, 0b0000_0100,
		] as [number, number, number, number];

		const expected = [
			0b0001_0010,
			0b0011_0100,
		];

		const result = buildBysquareHeader(inputData);
		expect(result).toEqual(expected);
	});

	const invalidHeaderTestCases = [
		{
			name: "invalid type",
			input: [0xFF, Version["1.0.0"], 0x00, 0x00],
			error: EncodeErrorMessage.BySquareType,
		},
		{
			name: "invalid version",
			input: [0x00, 0xFF, 0x00, 0x00],
			error: EncodeErrorMessage.Version,
		},
		{
			name: "invalid document type",
			input: [0x00, 0x00, 0xFF, 0x00],
			error: EncodeErrorMessage.DocumentType,
		},
		{
			name: "invalid reserved nibble",
			input: [0x00, 0x00, 0x00, 0xFF],
			error: EncodeErrorMessage.Reserved,
		},
	];

	test.each(invalidHeaderTestCases)("throws for $name", ({ input, error }) => {
		expect(() => {
			buildBysquareHeader(input as [number, number, number, number]);
		}).toThrow(EncodeError);
	});

	test("builds payload length", () => {
		const length = MAX_COMPRESSED_SIZE - 1;
		const dataView = new DataView(new ArrayBuffer(2));
		dataView.setUint16(0, length, true);

		const expected = new Uint8Array(dataView.buffer);
		const result = buildPayloadLength(length);

		expect(result).toEqual(expected);
	});

	test("throws for oversized payload", () => {
		expect(() => {
			buildPayloadLength(MAX_COMPRESSED_SIZE);
		}).toThrow(EncodeError);
	});
});

describe("encode diacritic removal", () => {
	test("removes diacritics from payload", () => {
		const input = JSON.parse(JSON.stringify(PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE));
		removeDiacritics(input);

		expect(input).toEqual(PAYMENT_ORDER_WITHOUT_DIACRITICS_EXPECTED);
	});
});

describe("date conversion", () => {
	test("should convert paymentDueDate from ISO 8601 to YYYYMMDD", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({ paymentDueDate: "2024-12-31" })],
		});

		const serialized = serialize(dataModel);

		expect(serialized).toContain("20241231");
	});

	test("should convert lastDate from ISO 8601 to YYYYMMDD", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({
				type: 2,
				day: 15,
				month: 1,
				periodicity: "1",
				lastDate: "20241011",
			})],
		});

		const serialized = serialize(dataModel);
		expect(serialized).toContain("20241011");
	});

	test("should handle undefined paymentDueDate", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({ paymentDueDate: undefined })],
		});

		const serialized = serialize(dataModel);

		expect(serialized).toBeTruthy();
		expect(serialized).toContain("\t\t");
	});

	test("should handle undefined lastDate", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({
				type: 2,
				day: 15,
				month: 1,
				periodicity: "1",
				lastDate: undefined,
			})],
		});

		const serialized = serialize(dataModel);

		expect(serialized).toBeTruthy();
	});

	test("should round-trip paymentDueDate through encode/decode", () => {
		const input = buildDataModel({
			payments: [buildPaymentOrder({ paymentDueDate: "2024-12-31" })],
		});

		const encoded = encode(input);
		const decoded = decode(encoded);

		expect(decoded.payments[0].paymentDueDate).toBe("2024-12-31");
	});

	test("should round-trip lastDate through encode/decode", () => {
		const input = buildDataModel({
			payments: [buildPaymentOrder({
				type: 2,
				day: 15,
				month: 1,
				periodicity: "m",
				lastDate: "20241011",
			})],
		});

		const encoded = encode(input);
		const decoded = decode(encoded);

		const standingOrder = decoded.payments[0] as any;
		expect(standingOrder.lastDate).toBe("20241011");
	});
});

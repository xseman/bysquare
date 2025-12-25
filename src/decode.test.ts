/**
 * Testy pre decode modul.
 *
 * Pokrýva:
 * - Základné decodovanie encodovaných QR stringov
 * - Deserializáciu z tab-separated formátu
 * - Round-trip encode/decode overenie
 * - Error handling pre neplatné vstupy
 * - Property-based testy pre konzistenciu decodovania
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { decompress } from "lzma1";
import * as base32hex from "./base32hex.js";
import { crc32 } from "./crc32.js";
import {
	decode,
	DecodeError,
	DecodeErrorMessage,
	deserialize,
} from "./decode.js";
import { encode } from "./encode.js";
import {
	buildDataModel,
	buildPaymentOrder,
	DECODE_TEST_CASES,
	DIRECT_DEBIT_DATA,
	DIRECT_DEBIT_FIXTURE,
	DIRECT_DEBIT_SERIALIZED,
	MINIMAL_PAYMENT,
	PAYMENT_ORDER_FIXTURE,
	PAYMENT_ORDER_SERIALIZED,
	PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE,
	ROUND_TRIP_TEST_CASES,
	SERIALIZED_DATA_MISSING_IBAN,
	STANDING_ORDER_DATA,
	STANDING_ORDER_FIXTURE,
	STANDING_ORDER_SERIALIZED,
	TEST_IBANS,
	VALID_PAYMENT_ORDER,
} from "./testdata/index.js";

describe("decode basic functionality", () => {
	test("decodes valid payment order", () => {
		const encoded = encode(VALID_PAYMENT_ORDER);
		const result = decode(encoded);

		expect(result).toBeDefined();
		expect(result.payments).toBeDefined();
		expect(result.payments.length).toBe(1);
	});

	test("decodes minimal payment", () => {
		const encoded = encode(MINIMAL_PAYMENT);
		const result = decode(encoded);

		expect(result).toBeDefined();
		expect(result.payments).toBeDefined();
		expect(result.payments.length).toBe(1);
	});

	test("decodes payment with diacritics", () => {
		const encoded = encode(PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE);
		const result = decode(encoded);

		expect(result).toBeDefined();
		expect(result.payments).toBeDefined();
		expect(result.payments.length).toBe(1);
	});

	test("decodes standing order", () => {
		const encoded = encode(STANDING_ORDER_DATA);
		const result = decode(encoded);

		expect(result).toBeDefined();
		expect(result.payments).toBeDefined();
		expect(result.payments.length).toBe(1);
	});

	test("decodes direct debit", () => {
		const encoded = encode(DIRECT_DEBIT_DATA);
		const result = decode(encoded);

		expect(result).toBeDefined();
		expect(result.payments).toBeDefined();
		expect(result.payments.length).toBe(1);
	});
});

describe("decode error cases", () => {
	test("empty string throws error", () => {
		expect(() => decode("")).toThrow();
	});

	test("invalid base32hex characters throw error", () => {
		expect(() => decode("INVALID123XYZ")).toThrow();
	});

	test("malformed BySquare data throws error", () => {
		expect(() => decode("91JPRV3F41BPYWKCCGGG")).toThrow();
	});

	test("too short data throws error", () => {
		expect(() => decode("00")).toThrow();
	});

	test("data with invalid header throws error", () => {
		expect(() => decode("FF00")).toThrow();
	});

	test("throws for invalid input", () => {
		expect(() => decode("aaaa")).toThrow("Invalid base32hex string");
	});

	test("throws UnsupportedVersion for version > 1.1.0", () => {
		expect(() => {
			const fakeHeader = new Uint8Array([0x08, 0x00]);
			const encoded = base32hex.encode(fakeHeader, false);
			decode(encoded);
		}).toThrow();
	});
});

describe("decode deserialization", () => {
	test("throws missing IBAN error", () => {
		const serialized = SERIALIZED_DATA_MISSING_IBAN;

		expect(() => deserialize(serialized)).toThrow(
			new DecodeError(DecodeErrorMessage.MissingIBAN),
		);
	});

	test("deserializes payment order", () => {
		const result = deserialize(PAYMENT_ORDER_SERIALIZED);
		expect(result).toEqual(PAYMENT_ORDER_FIXTURE);
	});

	test("deserializes standing order", () => {
		const result = deserialize(STANDING_ORDER_SERIALIZED);
		expect(result).toEqual(STANDING_ORDER_FIXTURE);
	});

	test("deserializes direct debit", () => {
		const result = deserialize(DIRECT_DEBIT_SERIALIZED);
		expect(result).toEqual(DIRECT_DEBIT_FIXTURE);
	});

	test("validates CRC32 checksum on decode", () => {
		const encoded = encode(MINIMAL_PAYMENT);

		const decoded_base32 = base32hex.decode(encoded, true);
		const compressed = decoded_base32.slice(4);

		const lzmaHeader = new Uint8Array(13);
		lzmaHeader[0] = 0x5d;
		lzmaHeader[1] = 0x00;
		lzmaHeader[2] = 0x00;
		lzmaHeader[3] = 0x02;
		lzmaHeader[4] = 0x00;

		const lzmaFull = new Uint8Array([...lzmaHeader, ...compressed]);
		const decompressed = decompress(lzmaFull);

		const checksum = decompressed!.slice(0, 4);
		const body = decompressed!.slice(4);
		const bodyText = new TextDecoder("utf-8").decode(body);

		const checksumValue = new DataView(
			checksum.buffer,
			checksum.byteOffset,
			4,
		).getUint32(0, true);
		const expectedChecksum = crc32(bodyText);

		expect(checksumValue).toBe(expectedChecksum);
	});
});

describe("decode multiple data", () => {
	test("decodes various QR codes correctly", () => {
		for (const [qr, encoded] of DECODE_TEST_CASES) {
			const decoded = decode(qr);
			expect(decoded).toEqual(encoded);
		}
	});
});

describe("decode property based", () => {
	test("decode always returns valid DataModel for encoded data", () => {
		const validIbans = [
			TEST_IBANS.SK_VALID,
			TEST_IBANS.CZ_VALID,
			TEST_IBANS.AT_VALID,
		];

		for (let i = 0; i < 50; i++) {
			const randomData = buildDataModel({
				invoiceId: `test-${i}`,
				payments: [buildPaymentOrder({
					amount: Math.round(Math.random() * 10_000) / 100,
					bankAccounts: [{
						iban: validIbans[Math.floor(Math.random() * validIbans.length)],
					}],
					variableSymbol: String(Math.floor(Math.random() * 999_999)),
				})],
			});

			const encoded = encode(randomData);
			const decoded = decode(encoded);

			expect(decoded).toEqual(randomData);
		}
	});
});

describe("round trip verification", () => {
	test.each(ROUND_TRIP_TEST_CASES as unknown as any[])("$name", ({ data }) => {
		const encoded = encode(data);
		const decoded = decode(encoded);
		expect(decoded).toEqual(data);
	});
});

/**
 * Tests for the encode module.
 *
 * Covers:
 * - Basic encoding of payment orders, standing orders, and direct debits
 * - Serialization to tab-separated format
 * - Diacritics removal (deburr)
 * - Error handling for invalid inputs
 * - Property-based tests for encoding consistency
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { Version } from "../types.js";
import { decode } from "./decode.js";
import {
	encode,
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
import { CurrencyCode } from "./types.js";

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
					currencyCode: validCurrencies[Math.floor(Math.random() * validCurrencies.length)],
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
			payments: [buildPaymentOrder({
				paymentDueDate: "20241231",
			})],
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
			payments: [buildPaymentOrder({
				paymentDueDate: undefined,
			})],
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
			payments: [buildPaymentOrder({
				paymentDueDate: "20241231",
			})],
		});

		const encoded = encode(input);
		const decoded = decode(encoded);

		expect(decoded.payments[0].paymentDueDate).toBe("20241231");
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

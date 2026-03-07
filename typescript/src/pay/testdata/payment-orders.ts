/**
 * Payment order test fixtures.
 *
 * Contains various payment order data structures for testing:
 * - Basic payment orders with common fields
 * - Minimal payments with only required fields
 * - Payments with diacritics for deburr testing
 * - Serialized representations for serialize/deserialize testing
 */

import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
} from "../types.js";
import {
	TEST_IBANS,
	TEST_SYMBOLS,
} from "./constants.js";

/**
 * Payment order fixture for encode/decode serialization tests.
 * Used primarily in encode.test.ts and decode.test.ts.
 */
export const PAYMENT_ORDER_FIXTURE = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: TEST_SYMBOLS.SIMPLE,
			beneficiary: { name: "John Doe" },
		},
	],
} satisfies DataModel;

/**
 * Standard payment order with all common fields populated.
 * Used for basic encode/decode round-trip tests and validation.
 */
export const VALID_PAYMENT_ORDER: DataModel = {
	invoiceId: "test-001",
	payments: [{
		type: PaymentOptions.PaymentOrder,
		amount: 100.0,
		currencyCode: CurrencyCode.EUR,
		bankAccounts: [{ iban: TEST_IBANS.SK_VALID }],
		variableSymbol: TEST_SYMBOLS.SIMPLE,
		beneficiary: { name: "John Doe" },
	}],
};

/**
 * Minimal payment with only required fields.
 * Tests that the system handles payments with no optional fields.
 */
export const MINIMAL_PAYMENT: DataModel = {
	payments: [{
		type: PaymentOptions.PaymentOrder,
		amount: 0, // Add explicit amount to match encode/decode behavior
		currencyCode: CurrencyCode.EUR,
		bankAccounts: [{ iban: TEST_IBANS.SK_VALID }],
		beneficiary: { name: "John Doe" },
	}],
};

/**
 * Tab-separated serialized representation of PAYMENT_ORDER_FIXTURE.
 * Used to test the serialize/deserialize functions.
 */
export const PAYMENT_ORDER_SERIALIZED = /** dprint-ignore */ [
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
	"\t", TEST_IBANS.SK_VALID,
	"\t",
	"\t", "0",
	"\t", "0",
	"\t", "John Doe",
	"\t",
	"\t",
].join("");

/**
 * Payment order fixture with diacritics for testing diacritics removal (deburr).
 * This fixture should be encoded with diacritics converted to ASCII.
 */
export const PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: TEST_SYMBOLS.SIMPLE,
			paymentNote: "Príspevok na kávu",
			beneficiary: {
				name: "Ján Kováč",
				city: "Košice",
				street: "Štúrova 27",
			},
		},
	],
} satisfies DataModel;

/**
 * Expected result after removing diacritics from PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE.
 * Used to verify the deburr function works correctly.
 */
export const PAYMENT_ORDER_WITHOUT_DIACRITICS_EXPECTED = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: TEST_SYMBOLS.SIMPLE,
			paymentNote: "Prispevok na kavu",
			beneficiary: {
				name: "Jan Kovac",
				city: "Kosice",
				street: "Sturova 27",
			},
		},
	],
} satisfies DataModel;

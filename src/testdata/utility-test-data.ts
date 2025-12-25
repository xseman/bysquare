/**
 * Utility test data for table-driven tests.
 *
 * Contains test case arrays for use with test.each() pattern.
 * Each array contains objects with test name, input, and expected result.
 */

import { CurrencyCode } from "../types.js";
import { TEST_IBANS } from "./constants.js";

/**
 * IBAN validation test cases.
 * Tests valid and invalid IBAN formats from different countries.
 */
export const IBAN_TEST_CASES = [
	{ name: "valid Slovak IBAN", iban: TEST_IBANS.SK_VALID, shouldPass: true },
	{ name: "valid Czech IBAN", iban: TEST_IBANS.CZ_VALID, shouldPass: true },
	{ name: "valid Austrian IBAN", iban: TEST_IBANS.AT_VALID, shouldPass: true },
	{ name: "invalid IBAN format", iban: "INVALID123", shouldPass: false },
	{ name: "empty IBAN", iban: "", shouldPass: false },
	{ name: "too short IBAN", iban: "SK96", shouldPass: false },
	{ name: "too long IBAN", iban: "SK9611000000002918599669EXTRA", shouldPass: false },
];

/**
 * Currency code validation test cases.
 * Note: validator.isISO4217() is case-insensitive and accepts "XXX" (no currency).
 */
export const CURRENCY_TEST_CASES = [
	{ name: "EUR currency", currency: CurrencyCode.EUR, shouldPass: true },
	{ name: "USD currency", currency: CurrencyCode.USD, shouldPass: true },
	{ name: "CZK currency", currency: CurrencyCode.CZK, shouldPass: true },
	{ name: "invalid currency", currency: "NOTACURRENCY" as CurrencyCode, shouldPass: false },
	{ name: "lowercase currency", currency: "eur" as CurrencyCode, shouldPass: true }, // validator is case-insensitive
];

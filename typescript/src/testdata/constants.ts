/**
 * Shared test constants used across test files.
 *
 * This file centralizes commonly used test values to:
 * - Reduce duplication across test files
 * - Provide consistent test data
 * - Make tests more maintainable
 * - Enable easy updates to test values
 */

import { CurrencyCode } from "../types.js";

/**
 * Valid IBAN test values for different countries.
 * All IBANs have valid checksums and formats.
 */
export const TEST_IBANS = {
	/** Valid Slovak IBAN - primary test value */
	SK_VALID: "SK9611000000002918599669",
	/** Valid Slovak IBAN - with spaces (same as SK_VALID) */
	SK_VALID_SPACED: "SK96 1100 0000 0029 1859 9669",
	/** Valid Slovak IBAN - alternative 1 */
	SK_VALID_2: "SK5681800000007000157042",
	/** Valid Slovak IBAN - alternative 2 */
	SK_VALID_3: "SK9181800000007000155733",
	/** Valid Slovak IBAN - alternative 3 */
	SK_VALID_4: "SK4523585719461382368397",
	/** Valid Slovak IBAN - alternative 4 */
	SK_VALID_5: "SK2738545237537948273958",
	/** Valid Czech IBAN */
	CZ_VALID: "CZ6508000000192000145399",
	/** Valid Austrian IBAN */
	AT_VALID: "AT611904300234573201",
} as const;

/**
 * Invalid IBAN test values with incorrect checksums.
 * Used for testing validation rejection.
 */
export const TEST_INVALID_IBANS = {
	/** Slovak IBAN with wrong checksum (last digit changed) */
	SK_BAD_CHECKSUM: "SK9611000000002918599668",
	/** Czech IBAN with wrong checksum (last digit changed) */
	CZ_BAD_CHECKSUM: "CZ6508000000192000145398",
	/** Austrian IBAN with wrong checksum (last digit changed) */
	AT_BAD_CHECKSUM: "AT611904300234573202",
} as const;

/**
 * Test amounts covering various edge cases and common scenarios.
 */
export const TEST_AMOUNTS = {
	/** Zero amount */
	ZERO: 0,
	/** Minimal positive amount */
	SMALL: 0.01,
	/** Small decimal amount */
	SMALL_DECIMAL: 0.10,
	/** Standard test amount */
	STANDARD: 100.0,
	/** Amount with decimals */
	STANDARD_DECIMAL: 100.50,
	/** Larger amount */
	LARGE: 9999.99,
	/** Very large amount */
	VERY_LARGE: 999999.99,
} as const;

/**
 * Common currency codes used in tests.
 */
export const TEST_CURRENCIES = {
	EUR: CurrencyCode.EUR,
	USD: CurrencyCode.USD,
	CZK: CurrencyCode.CZK,
} as const;

/**
 * Common variable symbols for testing.
 */
export const TEST_SYMBOLS = {
	/** Simple numeric symbol */
	SIMPLE: "123",
} as const;

/**
 * Valid BIC codes for testing.
 */
export const TEST_BICS = {
	/** Valid BIC code */
	VALID: "TATRSKBX",
	/** Alternative valid BIC */
	VALID_2: "DEUTDEFF500",
} as const;

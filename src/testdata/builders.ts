/**
 * Test data builder functions for constructing test fixtures.
 *
 * Builders provide a flexible way to create test data with:
 * - Sensible defaults for all required fields
 * - Easy override of specific fields via partial objects
 * - Type-safe construction
 * - Reduced boilerplate in tests
 *
 * Usage example:
 *
 * ```typescript
 * const payment = buildPaymentOrder({ amount: 123.45 });
 * const model = buildDataModel({ invoiceId: "test-123" });
 * ```
 */

import {
	BankAccount,
	DataModel,
	Payment,
	PaymentOptions,
} from "../types.js";
import {
	TEST_AMOUNTS,
	TEST_CURRENCIES,
	TEST_IBANS,
} from "./constants.js";

/**
 * Builds a minimal bank account for testing.
 *
 * @param overrides - Fields to override
 * @returns BankAccount with defaults
 */
export function buildBankAccount(overrides?: Partial<BankAccount>): BankAccount {
	return {
		iban: TEST_IBANS.SK_VALID,
		...overrides,
	};
}

/**
 * Builds a payment order for testing.
 *
 * @param overrides - Fields to override
 * @returns Payment with type PaymentOrder
 */
export function buildPaymentOrder(overrides?: Partial<Payment>): Payment {
	return {
		type: PaymentOptions.PaymentOrder,
		amount: TEST_AMOUNTS.STANDARD,
		currencyCode: TEST_CURRENCIES.EUR,
		bankAccounts: [buildBankAccount()],
		...overrides,
	} as Payment;
}

/**
 * Builds a complete data model for testing.
 *
 * @param overrides - Fields to override
 * @returns DataModel with defaults
 */
export function buildDataModel(overrides?: Partial<DataModel>): DataModel {
	return {
		payments: [buildPaymentOrder()],
		...overrides,
	};
}

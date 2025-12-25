/**
 * Test data fixtures for direct debit functionality.
 *
 * Direct debits are used for recurring payments where the creditor
 * pulls funds from the debtor's account.
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
 * Direct debit fixture for encode/decode serialization tests.
 */
export const DIRECT_DEBIT_FIXTURE = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.DirectDebit,
			amount: 100.0,
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: TEST_SYMBOLS.SIMPLE,
		},
	],
} satisfies DataModel;

/**
 * Direct debit with basic required fields for testing.
 */
export const DIRECT_DEBIT_DATA: DataModel = {
	payments: [{
		type: PaymentOptions.DirectDebit,
		amount: 75.0,
		currencyCode: CurrencyCode.EUR,
		bankAccounts: [{ iban: TEST_IBANS.SK_VALID }],
		beneficiary: { name: "Test Creditor" },
	}],
};

/**
 * Tab-separated serialized representation of DIRECT_DEBIT_FIXTURE.
 */
export const DIRECT_DEBIT_SERIALIZED = /** dprint-ignore */ [
	"random-id",
	"\t", "1",
	"\t", "4",
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
	"\t", "1",
	"\t",
	"\t",
	"\t", "123",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t",
].join("");

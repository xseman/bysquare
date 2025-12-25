/**
 * Standing order test fixtures.
 *
 * Contains standing order data structures for testing recurring payments
 * with periodicity, execution day, and end date fields.
 */

import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
	Periodicity,
} from "../types.js";
import {
	TEST_IBANS,
	TEST_SYMBOLS,
} from "./constants.js";

/**
 * Standing order fixture for encode/decode serialization tests.
 */
export const STANDING_ORDER_FIXTURE = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
			],
			periodicity: Periodicity.Monthly,
			currencyCode: CurrencyCode.EUR,
			variableSymbol: TEST_SYMBOLS.SIMPLE,
			lastDate: "20241011",
			day: 1,
		},
	],
} satisfies DataModel;

/**
 * Standing order with basic required fields for testing.
 */
export const STANDING_ORDER_DATA: DataModel = {
	payments: [{
		type: PaymentOptions.StandingOrder,
		amount: 50.0,
		currencyCode: CurrencyCode.EUR,
		bankAccounts: [{ iban: TEST_IBANS.SK_VALID }],
		beneficiary: { name: "Test Beneficiary" },
		periodicity: "m",
	}],
};

/**
 * Tab-separated serialized representation of STANDING_ORDER_FIXTURE.
 */
export const STANDING_ORDER_SERIALIZED = /** dprint-ignore */ [
	"random-id",
	"\t", "1",
	"\t", "2",
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
	"\t", "1",
	"\t", "1",
	"\t",
	"\t", "m",
	"\t", "20241011",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("");

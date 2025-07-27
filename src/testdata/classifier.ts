import {
	CurrencyCode,
	DataModel,
	Month,
	PaymentOptions,
	Periodicity,
} from "../types.js";

/**
 * Test data for multiple month classifiers
 */
export const multipleMonthsStandingOrder = {
	invoiceId: "multiple-months-test",
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 75.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "999",
			day: 15,
			// Multiple months: January + July + October = 1 + 64 + 512 = 577 (specification example)
			month: Month.January | Month.July | Month.October,
			periodicity: Periodicity.Monthly,
			lastDate: "20251231",
		},
	],
} satisfies DataModel;

export const multipleMonthsSummedValue = {
	invoiceId: "multiple-months-summed-test",
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 125.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "888",
			day: 1,
			// Using summed value directly (577 = January + July + October from specification)
			month: 577,
			periodicity: Periodicity.Monthly,
			lastDate: "20251231",
		},
	],
} satisfies DataModel;

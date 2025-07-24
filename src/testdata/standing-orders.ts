import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
	Periodicity,
} from "../types.js";

export const payloadWithStandingOrder = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			periodicity: Periodicity.Monthly,
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
			lastDate: "20241011",
			day: 1,
		},
	],
} satisfies DataModel;

export const serializedStandingOrder = /** dprint-ignore */ [
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
	"\t", "SK9611000000002918599669",
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

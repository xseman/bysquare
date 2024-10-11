import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
} from "./types.js";

export const payloadWithPaymentOrder = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
} satisfies DataModel;

export const serializedPaymentOrder = /** dprint-ignore */ [
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
	"\t", "SK9611000000002918599669",
	"\t",
	"\t", "0",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("");

export const payloadWithStandingOrder = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
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
	"\t",
	"\t",
	"\t",
	"\t",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("");

export const payloadWithDirectDebit = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.DirectDebit,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
} satisfies DataModel;

export const serializedDirectDebit = /** dprint-ignore */ [
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
	"\t", "SK9611000000002918599669",
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

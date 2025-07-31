import {
	CurrencyCode,
	type DataModel,
	encode,
	PaymentOptions,
	Periodicity,
} from "bysquare";

const data = {
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
			paymentNote: "hello world",
			day: 1,
			periodicity: Periodicity.Monthly,
			paymentDueDate: "2024-08-30",
			beneficiary: {
				name: "Filip",
				city: "City",
				street: "Street",
			},
		},
	],
} satisfies DataModel;

const encoded = encode(data);

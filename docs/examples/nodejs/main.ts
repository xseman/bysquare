import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "./../../../src/index.js";
// import {
// 	CurrencyCode,
// 	DataModel,
// 	encode,
// 	PaymentOptions,
// } from "bysquare";

const encoded = encode({
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
			beneficiary: {
				name: "Filip",
				city: "City",
				street: "Street",
			},
		},
	],
});

console.log(encoded);

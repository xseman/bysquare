import {
	CurrencyCode,
	encode,
} from "npm:bysquare";

const qr = await encode({
	invoiceId: "random-id",
	payments: [
		{
			type: 1,
			amount: 100.0,
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
});

console.log(qr);

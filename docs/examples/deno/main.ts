import { generate } from "npm:bysquare@2.1.0";

const qr = await generate({
	invoiceId: "random-id",
	payments: [
		{
			type: 1,
			amount: 100.0,
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
			currencyCode: "EUR",
			variableSymbol: "123",
		},
	],
});

console.log(qr);

// import {
// 	CurrencyCode,
// 	encode,
// 	PaymentOptions,
// } from "../../../dist/index.js";
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "npm:bysquare";

const qr = encode({
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
});

console.log(qr);

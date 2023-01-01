// deno run --allow-all --unstable ./mod.ts
import { generate, PaymentOptions } from 'npm:bysquare';

const foo = await generate({
	InvoiceID: "random-string",
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: PaymentOptions.PaymentOrder,
	BankAccounts: 1,
	BeneficiaryName: "Filip",
	BeneficiaryAddressLine1: "Address",
	BeneficiaryAddressLine2: "City"
})

console.log(foo);

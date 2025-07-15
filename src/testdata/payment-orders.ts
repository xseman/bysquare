import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
} from "../types.js";

// Main payment order fixture - used by encode/decode tests
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

// Additional test data for round-trip testing
export const roundTripPaymentOrderData = {
	invoiceId: "2015001",
	payments: [{
		amount: 45.55,
		currencyCode: CurrencyCode.EUR,
		type: PaymentOptions.PaymentOrder,
		bankAccounts: [{ iban: "SK2738545237537948273958" }],
		beneficiary: { name: "Jane Doe" },
		paymentNote: "bendzín",
	}],
} satisfies DataModel;

export const simplePaymentOrderData = {
	payments: [{
		amount: 25.3,
		currencyCode: CurrencyCode.EUR,
		type: PaymentOptions.PaymentOrder,
		bankAccounts: [{ iban: "SK4523585719461382368397" }],
		beneficiary: { name: "John Doe" },
	}],
} satisfies DataModel;

// Data with diacritics for testing diacritics removal
export const paymentOrderWithDiacritics = {
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
			paymentNote: "Príspevok na kávu",
			beneficiary: {
				name: "Ján Kováč",
				city: "Košice",
				street: "Štúrova 27",
			},
		},
	],
} satisfies DataModel;

export const expectedPaymentOrderWithoutDiacritics = {
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
			paymentNote: "Prispevok na kavu",
			beneficiary: {
				name: "Jan Kovac",
				city: "Kosice",
				street: "Sturova 27",
			},
		},
	],
} satisfies DataModel;

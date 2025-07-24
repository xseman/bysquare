import {
	describe,
	expect,
	test,
} from "bun:test";

import { decode } from "./decode.js";
import { encode } from "./encode.js";
import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
} from "./types.js";

// Regression test data
const regressionTestCase1 = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 5.28,
			variableSymbol: "4001888450",
			constantSymbol: "3118",
			specificSymbol: "202402",
			bankAccounts: [
				{ iban: "SK5681800000007000157042" },
			],
		},
	],
} satisfies DataModel;

const regressionTestCase2 = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 0.10,
			variableSymbol: "6221555477",
			constantSymbol: "3118",
			specificSymbol: "202306",
			bankAccounts: [
				{ iban: "SK9181800000007000155733" },
			],
		},
	],
} satisfies DataModel;

const stressTestData = {
	invoiceId: "stress-test-id-" + Date.now(),
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 123.45,
			variableSymbol: "9876543210",
			constantSymbol: "0308",
			specificSymbol: "999999",
			bankAccounts: [
				{ iban: "SK5681800000007000157042" },
				{ iban: "SK9181800000007000155733" },
			],
			paymentNote: "This is a stress test with a longer note to test LZMA compression",
			beneficiary: {
				name: "Stress Test Company, s.r.o.",
				city: "Bratislava",
				street: "Námestie SNP 123/45",
			},
		},
	],
} satisfies DataModel;

const multiplePaymentsData = {
	invoiceId: "multi-payment-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 5.28,
			variableSymbol: "4001888450",
			constantSymbol: "3118",
			specificSymbol: "202402",
			bankAccounts: [
				{ iban: "SK5681800000007000157042" },
			],
		},
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 0.10,
			variableSymbol: "6221555477",
			constantSymbol: "3118",
			specificSymbol: "202306",
			bankAccounts: [
				{ iban: "SK9181800000007000155733" },
			],
		},
	],
} satisfies DataModel;

const compatibilityTestData = {
	invoiceId: "compatibility-test",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 100.00,
			variableSymbol: "1234567890",
			constantSymbol: "0308",
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
} satisfies DataModel;

// Test values for parameterized tests
const specificSymbolTestValues = [
	"202306",
	"202402",
	"202407",
	"202401",
];

const ibanTestValues = [
	"SK5681800000007000157042",
	"SK9181800000007000155733",
	"SK9611000000002918599669",
];

const constantSymbolTestValues = [
	"3118",
	"0308",
	"0558",
	"0001",
];

const amountTestValues = [
	0.01,
	0.10,
	1.00,
	5.28,
	10.55,
	100.00,
	1000.00,
	9999.99,
];

const combinationTestValues = [
	{
		iban: "SK5681800000007000157042",
		variableSymbol: "6221555477",
		constantSymbol: "3118",
		specificSymbol: "202402",
	},
	{
		iban: "SK9181800000007000155733",
		variableSymbol: "4001888450",
		constantSymbol: "3118",
		specificSymbol: "202306",
	},
	{
		iban: "SK5681800000007000157042",
		variableSymbol: "4001888450",
		constantSymbol: "3118",
		specificSymbol: "202306",
	},
];

describe("Regression tests", () => {
	test("basic regression test cases", () => {
		expect(decode(encode(regressionTestCase1))).toEqual(regressionTestCase1);
		expect(decode(encode(regressionTestCase2))).toEqual(regressionTestCase2);
	});

	test.each(specificSymbolTestValues)("specific symbol variations: %s", (symbol) => {
		const testData = {
			...regressionTestCase1,
			payments: [{
				...regressionTestCase1.payments[0],
				specificSymbol: symbol,
			}],
		};

		expect(decode(encode(testData))).toEqual(testData);
	});

	test.each(ibanTestValues)("IBAN variations: %s", (iban) => {
		const testData = {
			...regressionTestCase1,
			payments: [{
				...regressionTestCase1.payments[0],
				bankAccounts: [{ iban }],
			}],
		};

		expect(decode(encode(testData))).toEqual(testData);
	});

	test.each(constantSymbolTestValues)("constant symbol variations: %s", (symbol) => {
		const testData = {
			...regressionTestCase1,
			payments: [{
				...regressionTestCase1.payments[0],
				constantSymbol: symbol,
			}],
		};

		expect(decode(encode(testData))).toEqual(testData);
	});

	test.each(combinationTestValues)("combination variations: %o", (combo) => {
		const testData = {
			...regressionTestCase1,
			payments: [{
				...regressionTestCase1.payments[0],
				bankAccounts: [{ iban: combo.iban }],
				variableSymbol: combo.variableSymbol,
				constantSymbol: combo.constantSymbol,
				specificSymbol: combo.specificSymbol,
			}],
		};

		expect(decode(encode(testData))).toEqual(testData);
	});

	test.each(amountTestValues)("amount variations: %o", (amount) => {
		const testData = {
			...regressionTestCase1,
			payments: [{
				...regressionTestCase1.payments[0],
				amount,
			}],
		};

		expect(decode(encode(testData))).toEqual(testData);
	});

	test.each([1, 2, 3, 4, 5])("stress test data iteration %i", () => {
		expect(decode(encode(stressTestData))).toEqual(stressTestData);
	});

	test("multiple payments data", () => {
		expect(decode(encode(multiplePaymentsData))).toEqual(multiplePaymentsData);
	});

	test("compatibility test data", () => {
		expect(decode(encode(compatibilityTestData))).toEqual(compatibilityTestData);
	});
});

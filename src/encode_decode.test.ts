import assert from "node:assert";
import test, {describe} from "node:test";
import {decode} from "./decode.js";
import {encode} from "./encode.js";
import {CurrencyCode, PaymentOptions} from "./types.js";

describe("Regression tests for LZMA encoding/decoding issues", () => {
	// Test the specific problematic cases from issue report
	test("encode/decode with problematic case 1", () => {
		const testCaseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				}
			]
		};

		// This should not throw an exception
		const qrstring = encode(testCaseData);

		// Verify the data can be decoded back properly
		const decoded = decode(qrstring);
		assert.deepEqual(decoded, testCaseData, "Decoded data should match original data");
	});

	test("encode/decode with problematic case 2", () => {
		const testCaseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 0.10,
					variableSymbol: '6221555477',
					constantSymbol: '3118',
					specificSymbol: '202306',
					bankAccounts: [
						{iban: "SK9181800000007000155733"}
					]
				}
			]
		};

		// This should not throw an exception
		const qrstring = encode(testCaseData);

		// Verify the data can be decoded back properly
		const decoded = decode(qrstring);
		assert.deepEqual(decoded, testCaseData, "Decoded data should match original data");
	});

	// Test robustness with varied specificSymbol values
	test("encode/decode with various specificSymbol values", () => {
		const baseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402', // Will be modified in test
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				}
			]
		};

		const specificSymbols = ['202306', '202402', '202407', '202401'];

		for (const symbol of specificSymbols) {
			const testData = JSON.parse(JSON.stringify(baseData));
			testData.payments[0].specificSymbol = symbol;

			const qrstring = encode(testData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, testData, `Failed with specificSymbol: ${symbol}`);
		}
	});

	// Test with different IBAN values
	test("encode/decode with various IBAN values", () => {
		const baseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"} // Will be modified
					]
				}
			]
		};

		const ibanValues = [
			"SK5681800000007000157042",
			"SK9181800000007000155733",
			"SK9611000000002918599669"
		];

		for (const iban of ibanValues) {
			const testData = JSON.parse(JSON.stringify(baseData));
			testData.payments[0].bankAccounts[0].iban = iban;

			const qrstring = encode(testData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, testData, `Failed with IBAN: ${iban}`);
		}
	});

	// Test with different constantSymbol values
	test("encode/decode with various constantSymbol values", () => {
		const baseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118', // Will be modified
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				}
			]
		};

		const constantSymbols = ['3118', '0308', '0558', '0001'];

		for (const symbol of constantSymbols) {
			const testData = JSON.parse(JSON.stringify(baseData));
			testData.payments[0].constantSymbol = symbol;

			const qrstring = encode(testData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, testData, `Failed with constantSymbol: ${symbol}`);
		}
	});

	// Test combinations of problematic values
	test("encode/decode with combinations of problematic values", () => {
		// Base test case - known problematic combination
		const baseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				}
			]
		};

		// Combinations to test (mixing problematic elements from the report)
		const combinations = [
			// Combination 1: Mix case 1's IBAN with case 2's variable symbol
			{
				iban: "SK5681800000007000157042",
				variableSymbol: "6221555477",
				constantSymbol: "3118",
				specificSymbol: "202402"
			},
			// Combination 2: Mix case 2's IBAN with case 1's variable symbol
			{
				iban: "SK9181800000007000155733",
				variableSymbol: "4001888450",
				constantSymbol: "3118",
				specificSymbol: "202306"
			},
			// Combination 3: Mix different elements together
			{
				iban: "SK5681800000007000157042",
				variableSymbol: "4001888450",
				constantSymbol: "3118",
				specificSymbol: "202306"
			},
			// Add more combinations as needed
		];

		for (const combo of combinations) {
			const testData = JSON.parse(JSON.stringify(baseData));
			testData.payments[0].bankAccounts[0].iban = combo.iban;
			testData.payments[0].variableSymbol = combo.variableSymbol;
			testData.payments[0].constantSymbol = combo.constantSymbol;
			testData.payments[0].specificSymbol = combo.specificSymbol;

			const qrstring = encode(testData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, testData, `Failed with combination - IBAN: ${combo.iban}, VS: ${combo.variableSymbol}`);
		}
	});

	// Test various payment amounts that might trigger the issue
	test("encode/decode with various amount values", () => {
		const baseData = {
			invoiceId: "random-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28, // Will be modified
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				}
			]
		};

		// Test with various amounts, including edge cases
		const amounts = [0.01, 0.10, 1.00, 5.28, 10.55, 100.00, 1000.00, 9999.99];

		for (const amount of amounts) {
			const testData = JSON.parse(JSON.stringify(baseData));
			testData.payments[0].amount = amount;

			const qrstring = encode(testData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, testData, `Failed with amount: ${amount}`);
		}
	});

	// Specific test for the LZMA compression robustness
	test("encode/decode stress test for LZMA compression", () => {
		// Create a comprehensive test case with challenging data
		const stressTestData = {
			invoiceId: "stress-test-id-" + Date.now(),
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 123.45,
					variableSymbol: '9876543210',
					constantSymbol: '0308',
					specificSymbol: '999999',
					bankAccounts: [
						{iban: "SK5681800000007000157042"},
						{iban: "SK9181800000007000155733"}
					],
					paymentNote: "This is a stress test with a longer note to test LZMA compression",
					beneficiary: {
						name: "Stress Test Company, s.r.o.",
						city: "Bratislava",
						street: "Námestie SNP 123/45"
					}
				}
			]
		};

		// Attempt multiple encode/decode cycles
		for (let i = 0; i < 5; i++) {
			const qrstring = encode(stressTestData);
			const decoded = decode(qrstring);
			assert.deepEqual(decoded, stressTestData, `Stress test failed on iteration ${i}`);
		}
	});

	// Test with multiple payments in single QR code
	test("encode/decode with multiple payments", () => {
		const dataWithMultiplePayments = {
			invoiceId: "multi-payment-id",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 5.28,
					variableSymbol: '4001888450',
					constantSymbol: '3118',
					specificSymbol: '202402',
					bankAccounts: [
						{iban: "SK5681800000007000157042"}
					]
				},
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 0.10,
					variableSymbol: '6221555477',
					constantSymbol: '3118',
					specificSymbol: '202306',
					bankAccounts: [
						{iban: "SK9181800000007000155733"}
					]
				}
			]
		};

		const qrstring = encode(dataWithMultiplePayments);
		const decoded = decode(qrstring);
		assert.deepEqual(decoded, dataWithMultiplePayments, "Failed with multiple payments");
	});
});

// Additional test suite for version compatibility checks
describe("Version compatibility regression tests", () => {
	test("ensure compatibility with v2.12.0 format", () => {
		// Create test data similar to what would work in v2.12.0
		const data = {
			invoiceId: "compatibility-test",
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					currencyCode: CurrencyCode.EUR,
					amount: 100.00,
					variableSymbol: '1234567890',
					constantSymbol: '0308',
					bankAccounts: [
						{iban: "SK9611000000002918599669"}
					]
				}
			]
		};

		const qrstring = encode(data);
		const decoded = decode(qrstring);
		assert.deepEqual(decoded, data, "Should maintain compatibility with v2.12.0 format");
	});
});

import assert from "node:assert";
import test, {describe} from "node:test";
import {decode} from "./decode.js";
import {encode} from "./encode.js";
import {CurrencyCode, PaymentOptions} from "./types.js";

describe("Regression tests", () => {
	// Single test that covers all data variations
	test("data", () => {
		// Test specific problematic cases from [issue report](https://github.com/xseman/bysquare/issues/55)
		// Case 1
		const testCase1 = {
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

		let qrstring = encode(testCase1);
		let decoded = decode(qrstring);
		assert.deepEqual(decoded, testCase1, "Decoded data should match original data for case 1");

		// Case 2
		const testCase2 = {
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

		qrstring = encode(testCase2);
		decoded = decode(qrstring);
		assert.deepEqual(decoded, testCase2, "Decoded data should match original data for case 2");


		// Base data structure for most tests
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

		// Test robustness with varied specificSymbol values
		const specificSymbols = ['202306', '202402', '202407', '202401'];

		for (const symbol of specificSymbols) {
			baseData.payments[0].specificSymbol = symbol;

			qrstring = encode(baseData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, baseData, `Failed with specificSymbol: ${symbol}`);
		}

		// Reset specificSymbol to original value
		baseData.payments[0].specificSymbol = '202402';

		// Test with different IBAN values
		const ibanValues = [
			"SK5681800000007000157042",
			"SK9181800000007000155733",
			"SK9611000000002918599669"
		];

		for (const iban of ibanValues) {
			baseData.payments[0].bankAccounts[0].iban = iban;

			qrstring = encode(baseData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, baseData, `Failed with IBAN: ${iban}`);
		}

		// Reset IBAN to original value
		baseData.payments[0].bankAccounts[0].iban = "SK5681800000007000157042";

		// Test with different constantSymbol values
		const constantSymbols = ['3118', '0308', '0558', '0001'];

		for (const symbol of constantSymbols) {
			baseData.payments[0].constantSymbol = symbol;

			qrstring = encode(baseData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, baseData, `Failed with constantSymbol: ${symbol}`);
		}

		// Reset constantSymbol to original value
		baseData.payments[0].constantSymbol = '3118';

		// Test combinations of problematic values
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
			baseData.payments[0].bankAccounts[0].iban = combo.iban;
			baseData.payments[0].variableSymbol = combo.variableSymbol;
			baseData.payments[0].constantSymbol = combo.constantSymbol;
			baseData.payments[0].specificSymbol = combo.specificSymbol;

			qrstring = encode(baseData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, baseData, `Failed with combination - IBAN: ${combo.iban}, VS: ${combo.variableSymbol}`);
		}

		// Reset to original values
		baseData.payments[0].bankAccounts[0].iban = "SK5681800000007000157042";
		baseData.payments[0].variableSymbol = '4001888450';
		baseData.payments[0].constantSymbol = '3118';
		baseData.payments[0].specificSymbol = '202402';

		// Test various payment amounts that might trigger the issue
		// Test with various amounts, including edge cases
		const amounts = [0.01, 0.10, 1.00, 5.28, 10.55, 100.00, 1000.00, 9999.99];

		for (const amount of amounts) {
			baseData.payments[0].amount = amount;

			qrstring = encode(baseData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, baseData, `Failed with amount: ${amount}`);
		}

		// Reset amount to original value
		baseData.payments[0].amount = 5.28;

		// Specific test for the LZMA compression robustness
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
			qrstring = encode(stressTestData);
			decoded = decode(qrstring);
			assert.deepEqual(decoded, stressTestData, `Stress test failed on iteration ${i}`);
		}

		// Test with multiple payments in single QR code
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

		qrstring = encode(dataWithMultiplePayments);
		decoded = decode(qrstring);
		assert.deepEqual(decoded, dataWithMultiplePayments, "Failed with multiple payments");

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

		qrstring = encode(data);
		decoded = decode(qrstring);
		assert.deepEqual(decoded, data, "Should maintain compatibility with v2.12.0 format");
	});
});

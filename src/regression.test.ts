import {
	describe,
	expect,
	test,
} from "bun:test";

import { decode } from "./decode.js";
import { encode } from "./encode.js";
import {
	amountTestValues,
	combinationTestValues,
	compatibilityTestData,
	constantSymbolTestValues,
	ibanTestValues,
	multiplePaymentsData,
	regressionTestCase1,
	regressionTestCase2,
	specificSymbolTestValues,
	stressTestData,
} from "./testdata/index.js";

describe("Regression data", () => {
	test("basic regression test cases", () => {
		expect(decode(encode(regressionTestCase1))).toEqual(regressionTestCase1);
		expect(decode(encode(regressionTestCase2))).toEqual(regressionTestCase2);

		const baseData = JSON.parse(JSON.stringify(regressionTestCase1));

		for (const symbol of specificSymbolTestValues) {
			baseData.payments[0].specificSymbol = symbol;
			expect(decode(encode(baseData))).toEqual(baseData);
		}

		baseData.payments[0].specificSymbol = "202402";

		for (const iban of ibanTestValues) {
			baseData.payments[0].bankAccounts[0].iban = iban;
			expect(decode(encode(baseData))).toEqual(baseData);
		}

		baseData.payments[0].bankAccounts[0].iban = "SK5681800000007000157042";

		for (const symbol of constantSymbolTestValues) {
			baseData.payments[0].constantSymbol = symbol;
			expect(decode(encode(baseData))).toEqual(baseData);
		}

		baseData.payments[0].constantSymbol = "3118";

		for (const combo of combinationTestValues) {
			baseData.payments[0].bankAccounts[0].iban = combo.iban;
			baseData.payments[0].variableSymbol = combo.variableSymbol;
			baseData.payments[0].constantSymbol = combo.constantSymbol;
			baseData.payments[0].specificSymbol = combo.specificSymbol;
			expect(decode(encode(baseData))).toEqual(baseData);
		}

		baseData.payments[0].bankAccounts[0].iban = "SK5681800000007000157042";
		baseData.payments[0].variableSymbol = "4001888450";
		baseData.payments[0].constantSymbol = "3118";
		baseData.payments[0].specificSymbol = "202402";

		for (const amount of amountTestValues) {
			baseData.payments[0].amount = amount;
			expect(decode(encode(baseData))).toEqual(baseData);
		}

		baseData.payments[0].amount = 5.28;

		for (let i = 0; i < 5; i++) {
			expect(decode(encode(stressTestData))).toEqual(stressTestData);
		}

		expect(decode(encode(multiplePaymentsData))).toEqual(multiplePaymentsData);
		expect(decode(encode(compatibilityTestData))).toEqual(compatibilityTestData);
	});
});

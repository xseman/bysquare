import assert from "node:assert";
import test, { describe } from "node:test";
import { CurrencyCode } from "./types.js";
import {
	validateBeneficiary,
	validateCurrencyCode,
	validateVariableSymbol,
} from "./validate.js";

const aLongString = "A long string with lenght 71                                        end";

describe("validate currency code", () => {
	test("should pass for valid currency code", () => {
		assert.doesNotThrow(() => {
			const result = validateCurrencyCode("EUR");
			assert(result, CurrencyCode.EUR);
		});
	});
	test("should throw an error for invalid currency code", () => {
		assert.throws(() => validateCurrencyCode("not currency code"));
	});
});

describe("validate variable symbol", () => {
	test("should pass for valid variable symbol", () => {
		assert.doesNotThrow(() => {
			const expected = 1231231231;
			const result = validateVariableSymbol(String(expected));
			assert.equal(result, expected);
			const result2 = validateVariableSymbol(1231231231);
			assert.equal(result2, expected);
		});
	});
	test("should throw an error for invalid variable symbol", () => {
		assert.throws(() => validateVariableSymbol("not variable symbol"));
		assert.throws(() => validateVariableSymbol("-1"));
		assert.throws(() => validateVariableSymbol(10000000000));
	});
});

describe("validate variable beneficiary", () => {
	test("should pass for valid beneficiary", () => {
		assert.doesNotThrow(() => {
			const expected = {
				name: "Pavol Novak",
				city: "Bratislava",
			};
			const result = validateBeneficiary(expected);
			assert.deepEqual(result, expected);
		});
	});
	test("should throw an error for invalid beneficiary", () => {
		assert.throws(() => validateBeneficiary("not beneficiary"));
		assert.throws(() => validateBeneficiary({}));
		assert.throws(() =>
			validateBeneficiary({
				name: aLongString,
			})
		);
	});
});

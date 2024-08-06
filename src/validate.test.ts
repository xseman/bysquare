import assert from "node:assert";
import test, { describe } from "node:test";
import { CurrencyCode } from "./types.js";
import {
	validateBankAccount,
	validateBeneficiary,
	validateBIC,
	validateCurrencyCode,
	validateIBAN,
	validateVariableSymbol,
} from "./validate.js";

const aLongString = "A long string with lenght 71                                        end";
const validIBAN = "LC14BOSL123456789012345678901234";

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

describe("validate beneficiary", () => {
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

describe("validate IBAN", () => {
	test("should pass for valid IBAN", () => {
		assert.doesNotThrow(() => {
			const expected = validIBAN;
			const result = validateIBAN(expected);
			assert.equal(result, expected);
		});
	});
	test("should throw an error for invalid IBAN", () => {
		assert.throws(() => validateIBAN("Too short"));
		assert.throws(() => validateIBAN(aLongString));
		assert.throws(() => validateIBAN("1114BOSL123456789012345678901234"));
	});
});
describe("validate BIC", () => {
	test("should pass for valid BIC", () => {
		assert.doesNotThrow(() => {
			const expected = "DEUTDEFF";
			const result = validateBIC(expected);
			assert.equal(result, expected);
			const expected2 = "DEUTDEFF500";
			const result2 = validateBIC(expected2);
			assert.equal(result2, expected2);
		});
	});
	test("should throw an error for invalid BIC", () => {
		assert.throws(() => validateBIC("Invalid length"));
		assert.throws(() => validateBIC("1EUTDEFF"));
	});
});

describe("validate bank account", () => {
	test("should pass for valid bank account", () => {
		assert.doesNotThrow(() => {
			const expected = {
				iban: validIBAN,
			};
			const result = validateBankAccount(expected);
			assert.deepEqual(result, expected);
		});
	});
	test("should throw an error for invalid bank account", () => {
		assert.throws(() =>
			validateBankAccount({
				iban: "an invalid iban",
			})
		);
		assert.throws(() => validateBankAccount({}));
	});
});

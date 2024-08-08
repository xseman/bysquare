import assert from "node:assert";
import test, { describe } from "node:test";
import { CurrencyCode } from "./types.js";
import {
	BankAccountSchema,
	BeneficiarySchema,
	BICSchema,
	CurrencyCodeSchema,
	IBANSchema,
	VariableSymbolSchema,
} from "./validate.js";

const aLongString = "A long string with lenght 71                                        end";
const validIBAN = "LC14BOSL123456789012345678901234";

describe("validate currency code", () => {
	test("should pass for valid currency code", () => {
		assert.doesNotThrow(() => {
			const result = CurrencyCodeSchema.parse("EUR");
			assert(result, CurrencyCode.EUR);
		});
	});
	test("should throw an error for invalid currency code", () => {
		assert.throws(() => CurrencyCodeSchema.parse("not currency code"));
	});
});

describe("validate variable symbol", () => {
	test("should pass for valid variable symbol", () => {
		assert.doesNotThrow(() => {
			const expected = 1231231231;
			const result = VariableSymbolSchema.parse(String(expected));
			assert.equal(result, expected);
			const result2 = VariableSymbolSchema.parse(1231231231);
			assert.equal(result2, expected);
		});
	});
	test("should throw an error for invalid variable symbol", () => {
		assert.throws(() => VariableSymbolSchema.parse("not variable symbol"));
		assert.throws(() => VariableSymbolSchema.parse("-1"));
		assert.throws(() => VariableSymbolSchema.parse(10000000000));
	});
});

describe("validate beneficiary", () => {
	test("should pass for valid beneficiary", () => {
		assert.doesNotThrow(() => {
			const expected = {
				name: "Pavol Novak",
				city: "Bratislava",
			};
			const result = BeneficiarySchema.parse(expected);
			assert.deepEqual(result, expected);
		});
	});
	test("should throw an error for invalid beneficiary", () => {
		assert.throws(() => BeneficiarySchema.parse("not beneficiary"));
		assert.throws(() => BeneficiarySchema.parse({}));
		assert.throws(() =>
			BeneficiarySchema.parse({
				name: aLongString,
			})
		);
	});
});

describe("validate IBAN", () => {
	test("should pass for valid IBAN", () => {
		assert.doesNotThrow(() => {
			const expected = validIBAN;
			const result = IBANSchema.parse(expected);
			assert.equal(result, expected);
		});
	});
	test("should throw an error for invalid IBAN", () => {
		assert.throws(() => IBANSchema.parse("Too short"));
		assert.throws(() => IBANSchema.parse(aLongString));
		assert.throws(() => IBANSchema.parse("1114BOSL123456789012345678901234"));
	});
});
describe("validate BIC", () => {
	test("should pass for valid BIC", () => {
		assert.doesNotThrow(() => {
			const expected = "DEUTDEFF";
			const result = BICSchema.parse(expected);
			assert.equal(result, expected);
			const expected2 = "DEUTDEFF500";
			const result2 = BICSchema.parse(expected2);
			assert.equal(result2, expected2);
		});
	});
	test("should throw an error for invalid BIC", () => {
		assert.throws(() => BICSchema.parse("Invalid length"));
		assert.throws(() => BICSchema.parse("1EUTDEFF"));
	});
});

describe("validate bank account", () => {
	test("should pass for valid bank account", () => {
		assert.doesNotThrow(() => {
			const expected = {
				iban: validIBAN,
			};
			const result = BankAccountSchema.parse(expected);
			assert.deepEqual(result, expected);
		});
	});
	test("should throw an error for invalid bank account", () => {
		assert.throws(() =>
			BankAccountSchema.parse({
				iban: "an invalid iban",
			})
		);
		assert.throws(() => BankAccountSchema.parse({}));
	});
});

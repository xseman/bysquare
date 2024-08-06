import assert from "node:assert";
import test, { describe } from "node:test";
import { validateCurrencyCode } from "./validate.js";

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

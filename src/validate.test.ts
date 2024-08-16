import assert from "node:assert";
import test, { describe } from "node:test";
import {
	validateBankAccount,
	ValidationError,
} from "./validate.js";

describe("validateBankAccount", () => {
	test("validate iban", () => {
		const path = "payments[0].bankAccounts[0]";
		assert.throws(() =>
			validateBankAccount({
				iban: "1234567890",
			}, path), new ValidationError("Invalid iban", path.concat(".iban")));
	});
});

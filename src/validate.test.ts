import assert from "node:assert";
import test, { describe } from "node:test";
import {
	validateBankAccount,
	validateSimplePayment,
	ValidationError,
	ValidationErrorMessage,
} from "./validate.js";

const iban = "LC14BOSL123456789012345678901234";

describe("validateBankAccount", () => {
	const path = "payments[0].bankAccounts[0]";
	test("validate IBAN", () => {
		assert.throws(
			() =>
				validateBankAccount({
					iban: "1234567890",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidIBAN, path.concat(".iban")),
		);
		assert.doesNotThrow(() =>
			validateBankAccount({
				iban,
			}, path)
		);
	});

	test("validate BIC", () => {
		assert.throws(
			() =>
				validateBankAccount({
					iban,
					bic: "123",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidBIC, path.concat(".bic")),
		);
		assert.throws(
			() =>
				validateBankAccount({
					iban,
					bic: "",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidBIC, path.concat(".bic")),
		);
		assert.doesNotThrow(() =>
			validateBankAccount({
				iban,
				bic: "DEUTDEFF500",
			}, path)
		);
	});
});

describe("validateSimplePayment", () => {
	const path = "payments[0]";
	test("validate bankAccounts", () => {
		assert.throws(
			() => {
				validateSimplePayment({
					bankAccounts: [{
						iban,
					}, {
						iban: "123",
					}],
					currencyCode: "EUR",
				}, path);
			},
			new ValidationError(
				ValidationErrorMessage.InvalidIBAN,
				`${path}.bankAccounts[1].iban`,
			),
		);
	});
});

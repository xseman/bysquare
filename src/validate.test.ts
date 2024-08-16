import assert, { doesNotThrow } from "node:assert";
import test, { describe } from "node:test";
import {
	validateBankAccount,
	validateSimplePayment,
	ValidationError,
	ValidationErrorMessage,
} from "./validate.js";

const iban = "LC14BOSL123456789012345678901234";
const validBankAccount = {
	iban,
};

describe("validateBankAccount", () => {
	const path = "payments[0].bankAccounts[0]";
	test("validate IBAN", () => {
		assert.throws(
			() =>
				validateBankAccount({
					iban: "1234567890",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidIBAN, `${path}.iban`),
		);
		assert.doesNotThrow(() => validateBankAccount(validBankAccount, path));
	});

	test("validate BIC", () => {
		assert.throws(
			() =>
				validateBankAccount({
					iban,
					bic: "123",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidBIC, `${path}.bic`),
		);
		assert.throws(
			() =>
				validateBankAccount({
					iban,
					bic: "",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidBIC, `${path}.bic`),
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
					bankAccounts: [validBankAccount, {
						iban: "123",
					}],
					currencyCode: "EUR",
				}, path);
			},
			new ValidationError(ValidationErrorMessage.InvalidIBAN, `${path}.bankAccounts[1].iban`),
		);
	});

	test("validate currencyCode", () => {
		assert.doesNotThrow(() =>
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: "EUR",
			}, path)
		);
		assert.throws(
			() =>
				validateSimplePayment({
					bankAccounts: [validBankAccount],
					currencyCode: "e",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidCurrencyCode, `${path}.currencyCode`),
		);
	});

	test("validate paymentDueDate", () => {
		assert.doesNotThrow(() =>
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: "EUR",
				paymentDueDate: "2024-08-08",
			}, path)
		);

		assert.throws(() =>
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: "EUR",
				paymentDueDate: "2024-08-52",
			}, path)
		);
	});
});

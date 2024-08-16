import assert from "node:assert";
import test, { describe } from "node:test";
import { PaymentOptions } from "./types.js";
import {
	validateBankAccount,
	validateDataModel,
	validateSimplePayment,
	ValidationError,
	ValidationErrorMessage,
} from "./validations.js";

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
					// todo: question is empty string valid input for arbitrary fields?
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

		assert.throws(
			() =>
				validateSimplePayment({
					bankAccounts: [validBankAccount],
					currencyCode: "EUR",
					paymentDueDate: "2024-08-52",
				}, path),
			new ValidationError(ValidationErrorMessage.InvalidDate, `${path}.paymentDueDate`),
		);
	});
});

describe("validateDataModel", () => {
	assert.doesNotThrow(() =>
		validateDataModel({
			payments: [{
				type: PaymentOptions.PaymentOrder,
				currencyCode: "EUR",
				bankAccounts: [validBankAccount],
			}],
		})
	);

	assert.throws(
		() =>
			validateDataModel({
				payments: [{
					type: PaymentOptions.PaymentOrder,
					currencyCode: "E",
					bankAccounts: [validBankAccount],
				}],
			}),
		new ValidationError(ValidationErrorMessage.InvalidCurrencyCode, `payments[0].currencyCode`),
	);
});

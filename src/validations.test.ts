import {
	describe,
	expect,
	test,
} from "bun:test";

import { validBankAccount } from "./testdata/index.js";
import { PaymentOptions } from "./types.js";
import {
	validateBankAccount,
	validateDataModel,
	validateSimplePayment,
	ValidationError,
	ValidationErrorMessage,
} from "./validations.js";

describe("validateBankAccount", () => {
	const path = "payments[0].bankAccounts[0]";

	test("validate IBAN", () => {
		const invalidIban = "1234567890";

		expect(() => {
			validateBankAccount({ iban: invalidIban }, path);
		}).toThrow(new ValidationError(ValidationErrorMessage.IBAN, `${path}.iban`));

		expect(() => {
			validateBankAccount(validBankAccount, path);
		}).not.toThrow();
	});

	test("validate BIC", () => {
		const invalidBic = "123";
		const validBic = "DEUTDEFF500";

		expect(() => {
			validateBankAccount({ iban: validBankAccount.iban, bic: invalidBic }, path);
		}).toThrow(new ValidationError(ValidationErrorMessage.BIC, `${path}.bic`));

		expect(() => {
			validateBankAccount({ iban: validBankAccount.iban, bic: "" }, path);
		}).not.toThrow();

		expect(() => {
			validateBankAccount({ iban: validBankAccount.iban, bic: validBic }, path);
		}).not.toThrow();
	});
});

describe("validateSimplePayment", () => {
	const path = "payments[0]";

	test("validate bankAccounts", () => {
		const invalidBankAccounts = [validBankAccount, { iban: "123" }];

		expect(() => {
			validateSimplePayment({
				bankAccounts: invalidBankAccounts,
				currencyCode: "EUR",
			}, path);
		}).toThrow(
			new ValidationError(ValidationErrorMessage.IBAN, `${path}.bankAccounts[1].iban`),
		);
	});

	test("validate currencyCode", () => {
		const validCurrency = "EUR";
		const invalidCurrency = "e";

		expect(() =>
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: validCurrency,
			}, path)
		).not.toThrow();

		expect(() =>
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: invalidCurrency,
			}, path)
		).toThrow(new ValidationError(ValidationErrorMessage.CurrencyCode, `${path}.currencyCode`));
	});

	test("validate paymentDueDate", () => {
		const validDate = "2024-08-08";
		const invalidDate = "2024-08-52";

		expect(() => {
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: "EUR",
				paymentDueDate: validDate,
			}, path);
		}).not.toThrow();

		expect(() => {
			validateSimplePayment({
				bankAccounts: [validBankAccount],
				currencyCode: "EUR",
				paymentDueDate: invalidDate,
			}, path);
		}).toThrow(new ValidationError(ValidationErrorMessage.Date, `${path}.paymentDueDate`));
	});
});

describe("validateDataModel", () => {
	test("valid data model", () => {
		const validDataModel = {
			payments: [{
				type: PaymentOptions.PaymentOrder,
				currencyCode: "EUR",
				bankAccounts: [validBankAccount],
			}],
		};

		expect(() => {
			validateDataModel(validDataModel);
		}).not.toThrow();
	});

	test("invalid data model", () => {
		const invalidDataModel = {
			payments: [{
				type: PaymentOptions.PaymentOrder,
				currencyCode: "E",
				bankAccounts: [validBankAccount],
			}],
		};

		expect(() => {
			validateDataModel(invalidDataModel);
		}).toThrow(
			new ValidationError(ValidationErrorMessage.CurrencyCode, `payments[0].currencyCode`),
		);
	});
});

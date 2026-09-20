import validator from "validator";

import { ValidationError } from "../errors.js";
import { isValidDate } from "../field.js";
import { Version } from "../types.js";
import {
	BankAccount,
	DataModel,
	type Payment,
	PaymentOptions,
} from "./types.js";

const ErrorMessages = {
	IBAN: "Invalid IBAN. Make sure ISO 13616 format is used.",
	BIC: "Invalid BIC. Make sure ISO 9362 format is used.",
	CurrencyCode: "Invalid currency code. Make sure ISO 4217 format is used.",
	Date: "Invalid date. Make sure YYYYMMDD format is used.",
	BeneficiaryName: "Beneficiary name is required.",
} as const;

/**
 * validates bankAccount fields:
 * - iban (ISO 13616)
 * - bic (ISO 9362)
 */
export function validateBankAccount(
	bankAccount: BankAccount,
	path: string,
): void {
	if (!validator.isIBAN(bankAccount.iban)) {
		throw new ValidationError(ErrorMessages.IBAN, `${path}.iban`);
	}

	if (bankAccount.bic && !validator.isBIC(bankAccount.bic)) {
		throw new ValidationError(ErrorMessages.BIC, `${path}.bic`);
	}
}

/**
 * validate simple payment fields:
 * - currencyCode (ISO 4217)
 * - paymentDueDate (YYYYMMDD format per v1.2 specification)
 * - bankAccounts
 *
 * @see validateBankAccount
 */
export function validateSimplePayment(
	simplePayment: Payment,
	path: string,
	version: Version = Version["1.2.0"],
): void {
	for (const [index, bankAccount] of simplePayment.bankAccounts.entries()) {
		validateBankAccount(bankAccount, `${path}.bankAccounts[${index}]`);
	}

	if (simplePayment.currencyCode && !validator.isISO4217(simplePayment.currencyCode)) {
		throw new ValidationError(
			ErrorMessages.CurrencyCode,
			`${path}.currencyCode`,
		);
	}

	if (
		simplePayment.paymentDueDate
		&& !isValidDate(simplePayment.paymentDueDate)
	) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.paymentDueDate`,
		);
	}

	if (
		simplePayment.type === PaymentOptions.StandingOrder
		&& simplePayment.lastDate
		&& !isValidDate(simplePayment.lastDate)
	) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.lastDate`,
		);
	}

	if (
		simplePayment.type === PaymentOptions.DirectDebit
		&& simplePayment.validTillDate
		&& !isValidDate(simplePayment.validTillDate)
	) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.validTillDate`,
		);
	}

	if (version >= Version["1.2.0"] && !simplePayment.beneficiary?.name) {
		throw new ValidationError(
			ErrorMessages.BeneficiaryName,
			`${path}.beneficiary.name`,
		);
	}
}

/**
 * Validate `payments` field of dataModel.
 *
 * @see validateSimplePayment
 * @see ValidationError
 */
export function validateDataModel(
	dataModel: DataModel,
	version: Version = Version["1.2.0"],
): DataModel {
	for (const [index, payment] of dataModel.payments.entries()) {
		validateSimplePayment(payment, `payments[${index}]`, version);
	}

	return dataModel;
}

import validator from "validator";

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
 * TODO: remove after release https://github.com/validatorjs/validator.js/pull/2659
 *
 * Validates date string in YYYYMMDD format.
 *
 * Uses validator.js library for semantic date validation by converting
 * YYYYMMDD to YYYY-MM-DD format (ISO 8601) which validator.isDate supports.
 *
 * @param date - Date string to validate in YYYYMMDD format
 * @returns true if valid YYYYMMDD date, false otherwise
 */
function isValidYYYYMMDD(date: string): boolean {
	// Check format: exactly 8 digits
	if (!/^\d{8}$/.test(date)) {
		return false;
	}

	// Convert YYYYMMDD to YYYY-MM-DD for validator.js
	const year = date.substring(0, 4);
	const month = date.substring(4, 6);
	const day = date.substring(6, 8);
	const isoFormat = `${year}-${month}-${day}`;

	// Use validator.js to check if it's a valid calendar date
	// This handles leap years, month boundaries, and all edge cases
	return validator.isDate(isoFormat, {
		format: "YYYY-MM-DD",
		strictMode: true,
		delimiters: ["-"],
	});
}

/**
 * This error will be thrown in case of a validation issue. It provides message with error description and specific path to issue in dataModel object.
 */
export class ValidationError extends Error {
	public path: string;

	/**
	 * @param message - explains, what is wrong on the specific field
	 * @param path - navigates to the specific field in DataModel, where error occurred
	 */
	constructor(
		message: string,
		path: string,
	) {
		super(message);
		this.name = this.constructor.name;
		this.path = path;
	}
}

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
		&& !isValidYYYYMMDD(simplePayment.paymentDueDate)
	) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.paymentDueDate`,
		);
	}

	if (
		simplePayment.type === PaymentOptions.StandingOrder
		&& simplePayment.lastDate
		&& !isValidYYYYMMDD(simplePayment.lastDate)
	) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.lastDate`,
		);
	}

	if (!simplePayment.beneficiary?.name) {
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
export function validateDataModel(dataModel: DataModel): DataModel {
	for (const [index, payment] of dataModel.payments.entries()) {
		validateSimplePayment(payment, `payments[${index}]`);
	}

	return dataModel;
}

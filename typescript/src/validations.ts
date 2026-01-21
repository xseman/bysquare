import validator from "validator";

import {
	BankAccount,
	DataModel,
	SimplePayment,
} from "./types.js";

const ErrorMessages = {
	IBAN: "Invalid IBAN. Make sure ISO 13616 format is used.",
	BIC: "Invalid BIC. Make sure ISO 9362 format is used.",
	CurrencyCode: "Invalid currency code. Make sure ISO 4217 format is used.",
	Date: "Invalid date. Make sure ISO 8601 format is used.",
	BeneficiaryName: "Beneficiary name is required.",
} as const;

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
 * - paymentDueDate (ISO 8601)
 * - bankAccounts
 *
 * @see validateBankAccount
 */
export function validateSimplePayment(
	simplePayment: SimplePayment,
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

	if (simplePayment.paymentDueDate && !validator.isDate(simplePayment.paymentDueDate)) {
		throw new ValidationError(
			ErrorMessages.Date,
			`${path}.paymentDueDate`,
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

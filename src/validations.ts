import validator from "validator";
import {
	BankAccount,
	DataModel,
	SimplePayment,
} from "./types.js";

export enum ValidationErrorMessage {
	InvalidIBAN = "Invalid IBAN",
	InvalidBIC = "Invalid BIC",
	InvalidCurrencyCode = "Invalid currency code",
	InvalidDate = "Invalid date",
}

export class ValidationError extends Error {
	override name = "ValidationError";
	path: string;

	/**
	 * @param message - explains, what is wrong on the specific field
	 * @param path - navigates to the specific field in DataModel, where error occurred
	 */
	constructor(message: ValidationErrorMessage, path: string) {
		super(String(message));
		this.path = path;
	}
}

export function validateBankAccount(bankAccount: BankAccount, path: string) {
	if (!validator.isIBAN(bankAccount.iban)) {
		throw new ValidationError(ValidationErrorMessage.InvalidIBAN, `${path}.iban`);
	}
	if (bankAccount.bic === "" || (bankAccount.bic && !validator.isBIC(bankAccount.bic))) {
		throw new ValidationError(ValidationErrorMessage.InvalidBIC, `${path}.bic`);
	}
}

/**
 * validate simple payment function
	- currencyCode CurrencyCode (ISO 4217)
	- paymentDueDate Date (ISO 8601)
	- bankAccount
*/
export function validateSimplePayment(simplePayment: SimplePayment, path: string) {
	for (const [index, bankAccount] of simplePayment.bankAccounts.entries()) {
		// todo: question is empty array of bank accounts valid input?
		validateBankAccount(bankAccount, `${path}.bankAccounts[${index}]`);
	}
	if (
		simplePayment.currencyCode === ""
		|| (simplePayment.currencyCode && !validator.isISO4217(simplePayment.currencyCode))
	) {
		throw new ValidationError(
			ValidationErrorMessage.InvalidCurrencyCode,
			`${path}.currencyCode`,
		);
	}
	if (
		simplePayment.paymentDueDate === ""
		|| (simplePayment.paymentDueDate && !validator.isDate(simplePayment.paymentDueDate))
	) {
		throw new ValidationError(
			ValidationErrorMessage.InvalidDate,
			`${path}.paymentDueDate`,
		);
	}
}

export function validateDataModel(dataModel: DataModel): DataModel {
	for (const [index, payment] of dataModel.payments.entries()) {
		// todo: question is empty array of payments valid input?
		validateSimplePayment(payment, `payments[${index}]`);
	}
	return dataModel;
}

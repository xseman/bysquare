import {
	BankAccount,
	DataModel,
	SimplePayment,
} from "./types.js";

// error should contain:
// message: explains, what is wrong
// path: points to the field, where problem occurred

export class ValidationError extends Error {
	override name = "ValidationError";
	path: string;

	/**
	 * @param message - explains, what is wrong on the specific field
	 * @param path - navigates to the field in DataModel, where error occurred
	 */
	constructor(message: string, path: string) {
		super(message);
		this.path = path;

		// Set the prototype explicitly to maintain the correct prototype chain
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

/**
 * validateBankAccount
 * iban (ISO 13616:2003)
 * bic? (ISO 9362)
 */

export function validateBankAccount(bankAccount: BankAccount, path: string) {
	// todo validate
}

/**
 * validate simple payment function
	- currencyCode CurrencyCode (ISO 4217)
	- paymentDueDate Date (ISO 8601)
	- bankAccount
*/
function validateSimplePayment(simplePayment: SimplePayment, path: string) {
	// todo validate
}

// validate function
// get data model return validated data model
// check fields one by one
// in case of failure, throw an error
// in case of success, return dataModel

export function validate(dataModel: DataModel): DataModel {
	for (const payment of dataModel.payments) {
		validateSimplePayment(payment, "payments");
	}
	return dataModel;
}

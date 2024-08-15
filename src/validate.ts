import { DataModel } from "./types.js";

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

// validate function
// get data model return validated data model
// check fields one by one
// in case of failure, throw an error
// in case of success, return dataModel

export function validate(dataModel: DataModel): DataModel {
	return dataModel;
}

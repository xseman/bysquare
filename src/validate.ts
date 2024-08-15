import { DataModel } from "./types.js";

// validate function
// get data model return validated data model
// check fields one by one
// in case of failure, throw an error
// error should contain:
// message: explains, what is wrong
// position: points to the field, where problem occurred
// in case of success, return dataModel

export function validate(dataModel: DataModel): DataModel {
	return dataModel;
}

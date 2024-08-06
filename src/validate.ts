import { z } from "zod";
import { CurrencyCode } from "./types.js";

const CurrencyCodeSchema = z.nativeEnum(CurrencyCode);

export function validateCurrencyCode(currencyCode: unknown) {
	return CurrencyCodeSchema.parse(currencyCode);
}

const IntegerSchema = z.union([
	z.string()
		.regex(/^\d+$/, "Variable symbol must be a string representing an integer")
		.transform((str) => parseInt(str, 10)),
	z.number().int("Variable symbol must be an integer"),
]);

const VariableSymbolSchema2 = IntegerSchema.refine((num) => num >= 0 && num <= 9999999999, {
	message: "Variable symbol must be between 0 and 9999999999",
});

export function validateVariableSymbol(variableSymbol: unknown) {
	return VariableSymbolSchema2.parse(variableSymbol);
}

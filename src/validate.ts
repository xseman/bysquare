import { z } from "zod";
import { CurrencyCode } from "./types.js";

export const CurrencyCodeSchema = z.nativeEnum(CurrencyCode);

const IntegerSchema = z.union([
	z.string()
		.regex(/^\d+$/, "Variable symbol must be a string representing an integer")
		.transform((str) => parseInt(str, 10)),
	z.number().int("Variable symbol must be an integer"),
]);

export const VariableSymbolSchema = IntegerSchema.refine((num) => num >= 0 && num <= 9999999999, {
	message: "Variable symbol must be between 0 and 9999999999",
});

export const BeneficiarySchema = z.object({
	name: z.string().max(70).optional(),
	street: z.string().max(70).optional(),
	city: z.string().max(70).optional(),
}).superRefine((data, ctx) => {
	if (!data.name && !data.street && !data.city) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "At least one of name, street, or city of beneficiary must be defined",
		});
	}
});

export const IBANSchema = z.string()
	.min(15, "IBAN must be at least 15 characters long")
	.max(34, "IBAN cannot be more than 34 characters long")
	.regex(
		/^[A-Z]{2}[0-9A-Z]{13,32}$/,
		"IBAN must start with two uppercase letters followed by up to 32 alphanumeric characters",
	);

export const BICSchema = z.string().regex(
	/^(?=[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$)/,
	"Invalid BIC format",
);

export const BankAccountSchema = z.object({
	iban: IBANSchema,
	bic: BICSchema.optional(),
});

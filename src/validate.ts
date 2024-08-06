import { z } from "zod";
import {
	BankAccount,
	Beneficiary,
	CurrencyCode,
} from "./types.js";

const CurrencyCodeSchema = z.nativeEnum(CurrencyCode);

export function validateCurrencyCode(currencyCode: unknown): CurrencyCode {
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

export function validateVariableSymbol(variableSymbol: unknown): number {
	return VariableSymbolSchema2.parse(variableSymbol);
}

const BeneficiarySchema = z.object({
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

export function validateBeneficiary(beneficiary: unknown): Beneficiary {
	return BeneficiarySchema.parse(beneficiary);
}
const IBANSchema = z.string()
	.min(15, "IBAN must be at least 15 characters long")
	.max(34, "IBAN cannot be more than 34 characters long")
	.regex(
		/^[A-Z]{2}[0-9A-Z]{13,32}$/,
		"IBAN must start with two uppercase letters followed by up to 32 alphanumeric characters",
	);

export function validateIBAN(iban: unknown): string {
	return IBANSchema.parse(iban);
}

const BICSchema = z.string().regex(
	/^(?=[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$)/,
	"Invalid BIC format",
);

export function validateBIC(bic: unknown): string {
	return BICSchema.parse(bic);
}

const BankAccountSchema = z.object({
	iban: IBANSchema,
	bic: BICSchema.optional(),
});
export function validateBankAccount(bankAccount: unknown): BankAccount {
	return BankAccountSchema.parse(bankAccount);
}

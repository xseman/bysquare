import { encode } from "./encode.js";
import {
	type BankAccount,
	CurrencyCode,
	PaymentOptions,
	SimplePayment,
	type StandingOrder,
} from "./types.js";

type PaymentInput =
	& Pick<BankAccount, "iban">
	& Pick<SimplePayment, "amount" | "currencyCode" | "variableSymbol">;

/**
 * @deprecated Will be removed as of v3.
 * This was intended to simplify the main API, but it has complicated it
 * instead, serving only as a limited wrapper. The main goal should be to
 * enhance documentation for the main API, enabling users to create their own
 * wrappers.
 *
 * Vytvorí QR pre jednorázovú platbu
 */
export function simplePayment(input: PaymentInput): string {
	return encode({
		payments: [
			{
				type: PaymentOptions.PaymentOrder,
				amount: input.amount,
				variableSymbol: input.variableSymbol,
				currencyCode: CurrencyCode.EUR,
				bankAccounts: [{ iban: input.iban }],
			},
		],
	});
}

/**
 * @deprecated Will be removed as of v3.
 * This was intended to simplify the main API, but it has complicated it
 * instead, serving only as a limited wrapper. The main goal should be to
 * enhance documentation for the main API, enabling users to create their own
 * wrappers.
 *
 * Vytvorí QR pre inkaso
 */
export function directDebit(input: PaymentInput): string {
	return encode({
		payments: [
			{
				type: PaymentOptions.DirectDebit,
				amount: input.amount,
				variableSymbol: input.variableSymbol,
				currencyCode: CurrencyCode.EUR,
				bankAccounts: [{ iban: input.iban }],
			},
		],
	});
}

type StandingInput =
	& PaymentInput
	& Pick<StandingOrder, "day" | "periodicity">;

/**
 * @deprecated Will be removed as of v3.
 * This was intended to simplify the main API, but it has complicated it
 * instead, serving only as a limited wrapper. The main goal should be to
 * enhance documentation for the main API, enabling users to create their own
 * wrappers.
 *
 * Vytvorí QR pre trvalý príkaz
 */
export function standingOrder(input: StandingInput): string {
	return encode({
		payments: [
			{
				type: PaymentOptions.StandingOrder,
				day: input.day,
				periodicity: input.periodicity,
				amount: input.amount,
				variableSymbol: input.variableSymbol,
				currencyCode: CurrencyCode.EUR,
				bankAccounts: [{ iban: input.iban }],
			},
		],
	});
}

import { encode } from "./encode.js";
import {
	type BankAccount,
	CurrencyCode,
	type Day,
	PaymentOptions,
	type Periodicity,
	SimplePayment,
} from "./types.js";

type PaymentInput =
	& Pick<BankAccount, "iban">
	& Pick<SimplePayment, "amount" | "currencyCode" | "variableSymbol">;

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

type StandingInput = PaymentInput & {
	day: Day | number;
	periodicity: Periodicity;
};

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

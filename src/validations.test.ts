/**
 * Testy pre validations modul.
 *
 * Pokrýva:
 * - IBAN validáciu (formát, checksum, country codes)
 * - BIC validáciu
 * - Currency code validáciu
 * - Payment a DataModel validáciu
 * - ValidationError správu a path verifikáciu
 *
 * NOTE: Validácia používa `validator` knižnicu, ktorá je case-insensitive
 * pre currency codes a akceptuje ISO 4217 kódy ako "XXX" (žiadna mena).
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	buildDataModel,
	buildPaymentOrder,
	CURRENCY_TEST_CASES,
	IBAN_TEST_CASES,
	MINIMAL_PAYMENT,
	TEST_BICS,
	TEST_IBANS,
	VALID_PAYMENT_ORDER,
} from "./testdata/index.js";
import { CurrencyCode } from "./types.js";
import {
	validateBankAccount,
	validateDataModel,
	validateSimplePayment,
	ValidationError,
} from "./validations.js";

describe("validateBankAccount", () => {
	test.each(IBAN_TEST_CASES)("$name", ({ iban, shouldPass }) => {
		const bankAccount = { iban };

		if (shouldPass) {
			expect(() => validateBankAccount(bankAccount, "test")).not.toThrow();
		} else {
			expect(() => validateBankAccount(bankAccount, "test")).toThrow(ValidationError);
		}
	});

	test("handles IBAN with spaces", () => {
		const bankAccount = { iban: TEST_IBANS.SK_VALID_SPACED };

		expect(() => validateBankAccount(bankAccount, "test")).not.toThrow();
	});

	test("validates BIC when provided", () => {
		const bankAccount = { iban: TEST_IBANS.SK_VALID, bic: TEST_BICS.VALID };

		expect(() => validateBankAccount(bankAccount, "test")).not.toThrow();
	});

	test("rejects invalid BIC", () => {
		const bankAccount = { iban: TEST_IBANS.SK_VALID, bic: "INVALID" };

		expect(() => validateBankAccount(bankAccount, "test")).toThrow(ValidationError);
	});
});

describe("validateSimplePayment", () => {
	test("validates payment with valid data", () => {
		const payment = buildPaymentOrder();

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test.each(CURRENCY_TEST_CASES)("$name", ({ currency, shouldPass }) => {
		const payment = buildPaymentOrder({ currencyCode: currency });

		if (shouldPass) {
			expect(() => validateSimplePayment(payment, "test")).not.toThrow();
		} else {
			expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
		}
	});

	test("validates multiple bank accounts", () => {
		const payment = buildPaymentOrder({
			bankAccounts: [
				{ iban: TEST_IBANS.SK_VALID },
				{ iban: TEST_IBANS.CZ_VALID },
			],
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects payment with invalid IBAN", () => {
		const payment = buildPaymentOrder({ bankAccounts: [{ iban: "INVALID" }] });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("validates payment due date", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "2024-12-31" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects invalid payment due date", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "invalid-date" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});
});

describe("validateDataModel", () => {
	test("validates valid payment order", () => {
		expect(() => validateDataModel(VALID_PAYMENT_ORDER)).not.toThrow();
	});

	test("validates minimal payment", () => {
		expect(() => validateDataModel(MINIMAL_PAYMENT)).not.toThrow();
	});

	test("returns the same data model when valid", () => {
		const result = validateDataModel(VALID_PAYMENT_ORDER);

		expect(result).toBe(VALID_PAYMENT_ORDER);
	});

	test("validates multiple payments", () => {
		const dataModel = buildDataModel({
			payments: [
				buildPaymentOrder({ bankAccounts: [{ iban: TEST_IBANS.SK_VALID }] }),
				buildPaymentOrder({
					currencyCode: CurrencyCode.USD,
					bankAccounts: [{ iban: TEST_IBANS.CZ_VALID }],
				}),
			],
		});

		expect(() => validateDataModel(dataModel)).not.toThrow();
	});

	test("rejects data model with invalid payment", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({ currencyCode: "INVALID" as CurrencyCode })],
		});

		expect(() => validateDataModel(dataModel)).toThrow(ValidationError);
	});

	test("provides correct error path for nested validation errors", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({ bankAccounts: [{ iban: "INVALID" }] })],
		});

		try {
			validateDataModel(dataModel);
			expect.unreachable("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			expect((error as ValidationError).path).toBe("payments[0].bankAccounts[0].iban");
		}
	});
});

describe("ValidationError", () => {
	test("contains correct message and path for currency error", () => {
		const dataModel = buildDataModel({
			payments: [buildPaymentOrder({ currencyCode: "NOTACURRENCY" as CurrencyCode })],
		});

		try {
			validateDataModel(dataModel);
			expect.unreachable("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			expect((error as ValidationError).message).toContain("currency");
			expect((error as ValidationError).path).toBe("payments[0].currencyCode");
		}
	});

	test("contains correct message and path for IBAN error", () => {
		const bankAccount = { iban: "INVALID" };

		try {
			validateBankAccount(bankAccount, "test.bankAccount");
			expect.unreachable("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			expect((error as ValidationError).message).toContain("Invalid IBAN");
			expect((error as ValidationError).path).toBe("test.bankAccount.iban");
		}
	});
});

/**
 * Testy dokumentujúce permissive správanie validator knižnice.
 *
 * Tieto testy slúžia ako regression guards - validator knižnica akceptuje:
 * - Case-insensitive currency codes (eur, EUR, Eur všetky platné)
 * - ISO 4217 "no currency" kód XXX
 *
 * Polia NEVALIDOVANÉ (permissive by design):
 * - variableSymbol, constantSymbol, specificSymbol (žiadna pattern check)
 * - amount (žiadna range check)
 * - field lengths (žiadna maxLength check)
 */
describe("permissive validation behavior", () => {
	test("accepts lowercase currency codes (validator is case-insensitive)", () => {
		const payment = buildPaymentOrder({ currencyCode: "eur" as CurrencyCode });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts XXX currency code (valid ISO 4217 'no currency')", () => {
		const payment = buildPaymentOrder({ currencyCode: "XXX" as CurrencyCode });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("does not validate symbol formats", () => {
		const payment = buildPaymentOrder({
			variableSymbol: "ABC with spaces!",
			constantSymbol: "XXXX",
			specificSymbol: "123-456",
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("does not validate amount range", () => {
		const negativeAmount = buildPaymentOrder({ amount: -100 });
		const hugeAmount = buildPaymentOrder({ amount: 9999999999999999 });

		expect(() => validateSimplePayment(negativeAmount, "test")).not.toThrow();
		expect(() => validateSimplePayment(hugeAmount, "test")).not.toThrow();
	});

	test("does not validate field lengths", () => {
		const payment = buildPaymentOrder({
			paymentNote: "A".repeat(200),
			beneficiary: { name: "B".repeat(100) },
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("does not validate invoiceId length", () => {
		const dataModel = buildDataModel({ invoiceId: "12345678901234567890" });

		expect(() => validateDataModel(dataModel)).not.toThrow();
	});
});

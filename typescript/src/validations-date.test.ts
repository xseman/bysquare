/**
 * Comprehensive tests for YYYYMMDD date validation.
 *
 * Validates both paymentDueDate and lastDate fields using validator.js library.
 *
 * Coverage:
 * - Format validation (exactly 8 digits in YYYYMMDD format)
 * - Semantic calendar validation (valid dates only)
 * - Leap year handling (including century rules)
 * - Month boundaries (28/29/30/31 days per month)
 * - Invalid dates (Feb 30, Apr 31, month 0/13, day 0/32)
 * - Standing order lastDate validation
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { buildPaymentOrder } from "./testdata/index.js";
import {
	type Payment,
	PaymentOptions,
} from "./types.js";
import {
	validateSimplePayment,
	ValidationError,
} from "./validations.js";

/**
 * Helper to build standing order payment for testing.
 */
function buildStandingOrder(overrides?: Partial<Payment>): Payment {
	return buildPaymentOrder({
		type: PaymentOptions.StandingOrder,
		day: 1,
		periodicity: "m",
		...overrides,
	});
}

describe("date format validation", () => {
	test("accepts valid YYYYMMDD format", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241231" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects YYYY-MM-DD format", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "2024-12-31" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects DD-MM-YYYY format", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "31-12-2024" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects date with slashes", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "12/31/2024" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects too short date", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "2024123" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects too long date", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "202412311" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects date with letters", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "2024ab31" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts undefined paymentDueDate", () => {
		const payment = buildPaymentOrder({ paymentDueDate: undefined });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});
});

describe("month boundary validation", () => {
	test("accepts month 01 (January)", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240115" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts month 12 (December)", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241215" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects month 00", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240015" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects month 13", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241315" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects month 99", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20249915" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});
});

describe("day boundary validation", () => {
	test("accepts day 01", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240101" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts day 31 in January", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240131" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects day 00", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240100" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects day 32", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240132" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects day 99", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240199" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});
});

describe("February validation", () => {
	test("accepts Feb 28 in non-leap year", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20230228" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects Feb 29 in non-leap year", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20230229" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts Feb 29 in leap year", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240229" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects Feb 30 in leap year", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240230" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects Feb 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240231" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts Feb 29 in year 2000 (leap year)", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20000229" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects Feb 29 in year 1900 (not a leap year)", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "19000229" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});
});

describe("30-day month validation", () => {
	test("accepts April 30", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240430" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects April 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240431" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts June 30", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240630" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects June 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240631" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts September 30", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240930" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects September 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240931" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts November 30", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241130" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects November 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241131" });

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});
});

describe("31-day month validation", () => {
	test("accepts January 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240131" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts March 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240331" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts May 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240531" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts July 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240731" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts August 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20240831" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts October 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241031" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("accepts December 31", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "20241231" });

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});
});

describe("lastDate validation for standing orders", () => {
	test("validates lastDate in YYYYMMDD format", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "20241231",
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects invalid lastDate format", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "2024-12-31",
		});

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("rejects semantically invalid lastDate", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "20240431",
		});

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("accepts undefined lastDate", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: undefined,
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("validates Feb 29 in leap year for lastDate", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "20240229",
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});

	test("rejects Feb 29 in non-leap year for lastDate", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "20230229",
		});

		expect(() => validateSimplePayment(payment, "test")).toThrow(ValidationError);
	});

	test("does not validate lastDate for payment orders", () => {
		const payment = buildPaymentOrder({
			paymentDueDate: "20240101",
		});

		expect(() => validateSimplePayment(payment, "test")).not.toThrow();
	});
});

describe("error messages and paths", () => {
	test("provides correct path for paymentDueDate error", () => {
		const payment = buildPaymentOrder({ paymentDueDate: "invalid" });

		try {
			validateSimplePayment(payment, "payments[0]");
			expect(false).toBe(true);
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			if (error instanceof ValidationError) {
				expect(error.path).toBe("payments[0].paymentDueDate");
				expect(error.message).toContain("YYYYMMDD");
			}
		}
	});

	test("provides correct path for lastDate error", () => {
		const payment = buildStandingOrder({
			paymentDueDate: "20240101",
			lastDate: "invalid",
		});

		try {
			validateSimplePayment(payment, "payments[0]");
			expect(false).toBe(true);
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			if (error instanceof ValidationError) {
				expect(error.path).toBe("payments[0].lastDate");
				expect(error.message).toContain("YYYYMMDD");
			}
		}
	});
});

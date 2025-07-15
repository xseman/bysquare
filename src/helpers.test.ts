import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	directDebit,
	simplePayment,
	standingOrder,
} from "./helpers.js";
import {
	directDebitInputData,
	expectedQrStrings,
	simplePaymentInputData,
	standingOrderInputData,
} from "./testdata/index.js";

describe("helpers", () => {
	test("simplePayment", () => {
		const input = simplePaymentInputData;
		const qrstring = simplePayment(input);
		expect(qrstring).toBe(expectedQrStrings.simplePayment);
	});

	test("directDebit", () => {
		const input = directDebitInputData;
		const qrstring = directDebit(input);
		expect(qrstring).toBe(expectedQrStrings.directDebit);
	});

	test("standingOrder", () => {
		const input = standingOrderInputData;
		const qrstring = standingOrder(input);
		expect(qrstring).toBe(expectedQrStrings.standingOrder);
	});
});

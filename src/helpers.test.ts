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
	test.each([
		{
			name: "simplePayment",
			input: simplePaymentInputData,
			expected: expectedQrStrings.simplePayment,
			fn: simplePayment,
		},
		{
			name: "directDebit",
			input: directDebitInputData,
			expected: expectedQrStrings.directDebit,
			fn: directDebit,
		},
		{
			name: "standingOrder",
			input: standingOrderInputData,
			expected: expectedQrStrings.standingOrder,
			fn: standingOrder,
		},
	])("$name", ({ input, expected, fn }) => {
		const qrstring = fn(input as any);
		expect(qrstring).toBe(expected);
	});
});

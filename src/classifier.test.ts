import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	decodeOptions,
	encodeOptions,
} from "./classifier.js";
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import {
	CurrencyCode,
	DataModel,
	Month,
	PaymentOptions,
	Periodicity,
} from "./types.js";

describe("classifier", () => {
	describe("decodeOptions", () => {
		test("decodes using specification decomposition algorithm", () => {
			// From specification: months January=1, July=64, October=512 sum to 577
			const result = decodeOptions(577);
			expect(result).toEqual([512, 64, 1]); // October, July, January
		});

		test("handles zero value", () => {
			const result = decodeOptions(0);
			expect(result).toEqual([]);
		});

		test("handles single value", () => {
			const result = decodeOptions(8);
			expect(result).toEqual([8]); // 2^3
		});
	});

	describe("encodeOptions", () => {
		test("encodes single month", () => {
			const result = encodeOptions([Month.January]);
			expect(result).toBe(1);
		});

		test("encodes multiple months", () => {
			const result = encodeOptions([Month.January, Month.July, Month.October]);
			expect(result).toBe(577); // 1 + 64 + 512 (specification example)
		});

		test("encodes all months", () => {
			const allMonths = Object.values(Month);
			const result = encodeOptions(allMonths);
			expect(result).toBe(4095); // 2^12 - 1
		});

		test("handles empty array", () => {
			const result = encodeOptions([]);
			expect(result).toBe(0);
		});
	});

	describe("decodeOptions", () => {
		test("decodes specification example for months", () => {
			// From specification: January=1, July=64, October=512 sum to 577
			const result = decodeOptions(577);
			expect(result).toEqual([512, 64, 1]); // October, July, January
		});

		test("decodes single month", () => {
			const result = decodeOptions(Month.March);
			expect(result).toEqual([Month.March]);
		});

		test("decodes multiple months", () => {
			const encoded = Month.February | Month.May | Month.December;
			const result = decodeOptions(encoded);
			expect(result).toEqual([Month.December, Month.May, Month.February]);
		});

		test("handles zero value", () => {
			const result = decodeOptions(0);
			expect(result).toEqual([]);
		});

		test("round trip with encoding", () => {
			const original = [Month.January, Month.June, Month.November];
			const encoded = encodeOptions(original);
			const decoded = decodeOptions(encoded);

			expect(decoded.sort()).toEqual(original.sort());
		});

		test("auto-detects range correctly", () => {
			// Test with specification example: 577 = January(1) + July(64) + October(512)
			const result = decodeOptions(577);
			expect(result).toEqual([512, 64, 1]); // Should work with auto-detection
		});

		test("handles single values", () => {
			const result = decodeOptions(Month.March);
			expect(result).toEqual([Month.March]);
		});

		test("handles zero value", () => {
			const result = decodeOptions(0);
			expect(result).toEqual([]);
		});

		test("works with complex combinations", () => {
			const testValue = Month.February | Month.May | Month.December;
			const result = decodeOptions(testValue);
			expect(result).toEqual([Month.December, Month.May, Month.February]);
		});
	});

	describe("Multiple Classifier Options Integration", () => {
		test("encode/decode multiple month classifiers", () => {
			const data = {
				invoiceId: "month-test",
				payments: [
					{
						type: PaymentOptions.StandingOrder,
						amount: 100.0,
						bankAccounts: [{ iban: "SK9611000000002918599669" }],
						currencyCode: CurrencyCode.EUR,
						day: 15,
						// Using specification example: January + July + October = 577
						month: Month.January | Month.July | Month.October,
						periodicity: Periodicity.Monthly,
						lastDate: "20241231",
					},
				],
			} satisfies DataModel;

			const qrstring = encode(data);
			const decoded = decode(qrstring);

			// Month should be preserved as summed value
			expect(decoded.payments[0]).toMatchObject({
				type: PaymentOptions.StandingOrder,
				month: 577, // 1 + 64 + 512
			});
		});

		test("specification compliance - month classifier example", () => {
			// From specification: months January=1, July=64, October=512 sum to 577
			const encoded = encodeOptions([Month.January, Month.July, Month.October]);
			expect(encoded).toBe(577);

			const decoded = decodeOptions(577);
			expect(decoded).toEqual([512, 64, 1]); // October, July, January
		});
	});
});

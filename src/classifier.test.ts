/**
 * Testy pre classifier (bitfield options) modul.
 *
 * Classifiers encoduje viacero možností do jediného čísla pomocou bitwise OR.
 * Používa sa primárne pre výber mesiacov v trvalých príkazoch.
 * Príklad: January(1) + July(64) + October(512) = 577
 */

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
import { TEST_IBANS } from "./testdata/index.js";
import {
	CurrencyCode,
	DataModel,
	Month,
	PaymentOptions,
	Periodicity,
} from "./types.js";

describe("classifier", () => {
	describe("encodeOptions", () => {
		test("encodes single month", () => {
			const result = encodeOptions([Month.January]);
			expect(result).toBe(1);
		});

		test("encodes multiple months", () => {
			const result = encodeOptions([Month.January, Month.July, Month.October]);
			expect(result).toBe(577); // 1 + 64 + 512 (príklad zo špecifikácie)
		});

		test("encodes all months", () => {
			const allMonths = Object.values(Month);
			const result = encodeOptions(allMonths);
			expect(result).toBe(4095); // 2^12 - 1 (všetky mesiace)
		});

		test("handles empty array", () => {
			const result = encodeOptions([]);
			expect(result).toBe(0);
		});
	});

	describe("decodeOptions", () => {
		describe("specification examples", () => {
			test("decodes specification example: 577 = January + July + October", () => {
				// January=1, July=64, October=512 = 577
				const result = decodeOptions(577);
				expect(result).toEqual([512, 64, 1]); // October, July, January (zostupne)
			});
		});

		describe("single value handling", () => {
			test("decodes single month", () => {
				const result = decodeOptions(Month.March);
				expect(result).toEqual([Month.March]);
			});

			test("handles power of 2 values", () => {
				const result = decodeOptions(8);
				expect(result).toEqual([8]); // 2^3
			});
		});

		describe("multiple value combinations", () => {
			test("decodes multiple months", () => {
				const encoded = Month.February | Month.May | Month.December;
				const result = decodeOptions(encoded);
				expect(result).toEqual([Month.December, Month.May, Month.February]);
			});
		});

		describe("edge cases", () => {
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
						bankAccounts: [{ iban: TEST_IBANS.SK_VALID }],
						currencyCode: CurrencyCode.EUR,
						day: 15,
						// January + July + October = 577
						month: Month.January | Month.July | Month.October,
						periodicity: Periodicity.Monthly,
						lastDate: "20241231",
					},
				],
			} satisfies DataModel;

			const qrstring = encode(data);
			const decoded = decode(qrstring);

			expect(decoded.payments[0]).toMatchObject({
				type: PaymentOptions.StandingOrder,
				month: 577, // 1 + 64 + 512
			});
		});
	});
});

import {
	expect,
	test,
} from "bun:test";

import {
	formatDecimal,
	isValidAmount,
} from "./field.js";

test("formatDecimal prints zero", () => {
	expect(formatDecimal(0)).toBe("0");
});

test("formatDecimal prints a whole number", () => {
	expect(formatDecimal(100)).toBe("100");
});

test("formatDecimal keeps two decimals", () => {
	expect(formatDecimal(100.5)).toBe("100.5");
});

test("formatDecimal keeps a large amount", () => {
	expect(formatDecimal(999999.99)).toBe("999999.99");
});

test("formatDecimal rounds a float artifact away", () => {
	expect(formatDecimal(0.1 + 0.2)).toBe("0.3");
});

test("formatDecimal rounds nine decimals to eight", () => {
	expect(formatDecimal(1.123456789)).toBe("1.12345679");
});

test("formatDecimal prints zero below eight decimals", () => {
	expect(formatDecimal(0.000000001)).toBe("0");
});

test("formatDecimal keeps a negative number", () => {
	expect(formatDecimal(-12.34)).toBe("-12.34");
});

test("formatDecimal leaves a missing value out", () => {
	expect(formatDecimal(undefined)).toBeUndefined();
});

test("formatDecimal prints a small value without an exponent", () => {
	expect(formatDecimal(0.0000001)).toBe("0.0000001");
});

test("formatDecimal keeps the zeros of a whole number", () => {
	expect(formatDecimal(1_000)).toBe("1000");
});

test.each([
	0,
	0.01,
	123.45,
	999_999_999_999_999,
	123456.12345678,
])("isValidAmount accepts %p", (amount) => {
	expect(isValidAmount(amount)).toBe(true);
});

test.each([
	-0.01,
	-100,
	NaN,
	Infinity,
	-Infinity,
	9_999_999_999_999_999,
	1234567.12345678,
	1e21,
])("isValidAmount rejects %p", (amount) => {
	expect(isValidAmount(amount)).toBe(false);
});

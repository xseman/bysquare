import {
	expect,
	test,
} from "bun:test";

import { formatDecimal } from "./field.js";

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

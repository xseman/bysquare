import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	decode,
	encode,
} from "./base32hex.js";
import {
	base32hexDecodeTestCases,
	base32hexLooseModeTestCases,
	base32hexNoPaddingTestCases,
	base32hexTestCases,
} from "./testdata/index.js";

describe("base32hex encoding", () => {
	test.each(base32hexTestCases)("$name", ({ input, expectedEncoded }) => {
		const output = encode(input);
		expect(output).toBe(expectedEncoded);
	});

	test.each(base32hexNoPaddingTestCases)("$name", ({ input, expectedEncoded }) => {
		const withPadding = false;
		const output = encode(input, withPadding);
		expect(output).toBe(expectedEncoded);
	});
});

describe("base32hex decoding", () => {
	test.each(base32hexDecodeTestCases)("$name", ({ input, expected }) => {
		const output = decode(input);
		expect(output).toEqual(expected);
	});

	test.each(base32hexLooseModeTestCases)("$name", ({ input, expected }) => {
		const looseMode = true;
		const output = decode(input, looseMode);
		expect(output).toEqual(expected);
	});

	test("invalid character", () => {
		const invalidInput = "CPNM!";
		expect(() => decode(invalidInput)).toThrow("Invalid base32hex string");
	});
});

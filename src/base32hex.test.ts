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
	base32hexTestCases.forEach(({ name, input, expectedEncoded }) => {
		test(name, () => {
			const output = encode(input);
			expect(output).toBe(expectedEncoded);
		});
	});

	base32hexNoPaddingTestCases.forEach(({ name, input, expectedEncoded }) => {
		test(name, () => {
			const withPadding = false;
			const output = encode(input, withPadding);
			expect(output).toBe(expectedEncoded);
		});
	});
});

describe("base32hex decoding", () => {
	base32hexDecodeTestCases.forEach(({ name, input, expected }) => {
		test(name, () => {
			const output = decode(input);
			expect(output).toEqual(expected);
		});
	});

	base32hexLooseModeTestCases.forEach(({ name, input, expected }) => {
		test(name, () => {
			const looseMode = true;
			const output = decode(input, looseMode);
			expect(output).toEqual(expected);
		});
	});

	test("invalid character", () => {
		const invalidInput = "CPNM!";
		expect(() => decode(invalidInput)).toThrow("Invalid base32hex string");
	});
});

import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	decode,
	encode,
} from "./base32hex.js";

const base32hexTestCases = [
	{
		name: "empty string",
		input: new Uint8Array([]),
		expectedEncoded: "",
	},
	{
		name: "single byte",
		input: new Uint8Array([102]),
		expectedEncoded: "CO======",
	},
	{
		name: "two bytes",
		input: new Uint8Array([102, 111]),
		expectedEncoded: "CPNG====",
	},
	{
		name: "three bytes",
		input: new Uint8Array([102, 111, 111]),
		expectedEncoded: "CPNMU===",
	},
	{
		name: "four bytes",
		input: new Uint8Array([102, 111, 111, 98]),
		expectedEncoded: "CPNMUOG=",
	},
	{
		name: "five bytes",
		input: new Uint8Array([102, 111, 111, 98, 97]),
		expectedEncoded: "CPNMUOJ1",
	},
	{
		name: "six bytes",
		input: new Uint8Array([102, 111, 111, 98, 97, 114]),
		expectedEncoded: "CPNMUOJ1E8======",
	},
];

const base32hexNoPaddingTestCases = [
	{ name: "single byte no padding", input: new Uint8Array([102]), expectedEncoded: "CO" },
	{ name: "two bytes no padding", input: new Uint8Array([102, 111]), expectedEncoded: "CPNG" },
	{
		name: "three bytes no padding",
		input: new Uint8Array([102, 111, 111]),
		expectedEncoded: "CPNMU",
	},
	{
		name: "four bytes no padding",
		input: new Uint8Array([102, 111, 111, 98]),
		expectedEncoded: "CPNMUOG",
	},
	{
		name: "five bytes no padding",
		input: new Uint8Array([102, 111, 111, 98, 97]),
		expectedEncoded: "CPNMUOJ1",
	},
	{
		name: "six bytes no padding",
		input: new Uint8Array([102, 111, 111, 98, 97, 114]),
		expectedEncoded: "CPNMUOJ1E8",
	},
];

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

const base32hexDecodeTestCases = [
	{
		name: "decode empty string",
		input: "",
		expected: new Uint8Array([]),
	},
	{
		name: "decode single byte",
		input: "CO======",
		expected: new Uint8Array([102]),
	},
	{
		name: "decode two bytes",
		input: "CPNG====",
		expected: new Uint8Array([102, 111]),
	},
	{
		name: "decode three bytes",
		input: "CPNMU===",
		expected: new Uint8Array([102, 111, 111]),
	},
	{
		name: "decode four bytes",
		input: "CPNMUOG=",
		expected: new Uint8Array([102, 111, 111, 98]),
	},
	{
		name: "decode five bytes",
		input: "CPNMUOJ1",
		expected: new Uint8Array([102, 111, 111, 98, 97]),
	},
	{
		name: "decode six bytes",
		input: "CPNMUOJ1E8======",
		expected: new Uint8Array([102, 111, 111, 98, 97, 114]),
	},
];

const base32hexLooseModeTestCases = [
	{
		name: "decode with lowercase",
		input: "cpnmu===",
		expected: new Uint8Array([102, 111, 111]),
	},
	{
		name: "decode with mixed case",
		input: "CpNmU===",
		expected: new Uint8Array([102, 111, 111]),
	},
	{
		name: "decode without padding",
		input: "CPNMU",
		expected: new Uint8Array([102, 111, 111]),
	},
];

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

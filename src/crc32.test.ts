import { strict as assert } from "node:assert";
import test, { describe } from "node:test";

import { crc32 } from "./crc32.js";

describe("crc32", () => {
	test("empty string", () => {
		const result = crc32("");
		assert.equal(result, 0);
	});

	test('"123456789"', () => {
		const result = crc32("123456789");
		const expected = 0xCBF43926;
		assert.equal(result, expected);
	});

	test('"Hello, World!"', () => {
		const result = crc32("Hello, World!");
		const expected = 0xEC4AC3D0;
		assert.equal(result, expected);
	});

	test("a long string", () => {
		const longString = "a".repeat(1000);
		const result = crc32(longString);
		const expected = 0x9A38DA03;
		assert.equal(result, expected);
	});
});

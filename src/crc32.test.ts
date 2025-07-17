import {
	describe,
	expect,
	test,
} from "bun:test";

import { crc32 } from "./crc32.js";
import { crc32TestCases } from "./testdata/index.js";

describe("crc32", () => {
	test.each(crc32TestCases)("$name", ({ input, expected }) => {
		const result = crc32(input);
		expect(result).toBe(expected);
	});
});

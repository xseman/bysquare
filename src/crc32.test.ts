/**
 * Testy pre CRC32 checksum modul.
 *
 * CRC32 sa používa na overenie integrity dát v BySquare formáte.
 * Testy overujú správny výpočet checksum pre rôzne vstupy.
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { crc32 } from "./crc32.js";

/**
 * Test cases so známymi CRC32 hodnotami.
 * Hodnoty overené podľa štandardných CRC32 implementácií.
 */
const crc32TestCases = [
	{ name: "empty string", input: "", expected: 0 },
	{ name: "single character", input: "a", expected: 3904355907 },
	{ name: "hello world", input: "hello world", expected: 222957957 },
	{ name: "123456789", input: "123456789", expected: 3421780262 },
];

describe("crc32", () => {
	test.each(crc32TestCases)("$name", ({ input, expected }) => {
		const result = crc32(input);
		expect(result).toBe(expected);
	});
});

import {
	expect,
	test,
} from "bun:test";

import { deburr } from "./deburr.js";

const deburrTestCases = [
	{
		name: "Slovak diacritics",
		input: "Pôvodná faktúra",
		expected: "Povodna faktura",
	},
];

test.each(deburrTestCases)("deburr - $name", ({ input, expected }) => {
	const result = deburr(input);
	expect(result).toBe(expected);
});

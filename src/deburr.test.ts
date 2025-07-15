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

deburrTestCases.forEach(({ name, input, expected }) => {
	test(`deburr - ${name}`, () => {
		const result = deburr(input);
		expect(result).toBe(expected);
	});
});

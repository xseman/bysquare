/**
 * Tests for the deburr (diacritics removal) module.
 *
 * BySquare format requires ASCII-only text, so diacritics
 * must be converted to basic characters (e.g., "á" -> "a").
 */

import {
	describe,
	expect,
	test,
} from "bun:test";

import { deburr } from "./deburr.js";

describe("deburr", () => {
	/**
	 * Test cases for diacritics removal.
	 * Central European diacritics are common in BySquare payment data.
	 */
	const deburrTestCases = [
		{
			name: "Slovak diacritics",
			input: "Pôvodná faktúra",
			expected: "Povodna faktura",
		},
		{
			name: "Czech diacritics",
			input: "Príliš žluťoučký kůň",
			expected: "Prilis zlutoucky kun",
		},
		{
			name: "Polish diacritics",
			input: "Żółć gęślą jaźń",
			expected: "Zolc gesla jazn",
		},
		{
			name: "Hungarian diacritics",
			input: "Öt szép szűz lány őrült író",
			expected: "Ot szep szuz lany orult iro",
		},
		{
			name: "German diacritics",
			input: "Größe Übung Äpfel",
			expected: "Grosse Ubung Apfel",
		},
		{
			name: "German Eszett",
			input: "ß",
			expected: "ss",
		},
		{
			name: "no diacritics passthrough",
			input: "Hello World 123",
			expected: "Hello World 123",
		},
		{
			name: "empty string",
			input: "",
			expected: "",
		},
		{
			name: "mixed content with numbers and symbols",
			input: "Číslo 123 - Ján @ test.sk",
			expected: "Cislo 123 - Jan @ test.sk",
		},
	];

	test.each(deburrTestCases)("$name", ({ input, expected }) => {
		const result = deburr(input);
		expect(result).toBe(expected);
	});
});

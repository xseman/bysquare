import assert from "node:assert";
import test from "node:test";
import {deburr, deburredLettersMap} from "./deburr.js";

test("deburr", () => {
	const deburred = deburr('Pôvodná faktúra')
	assert.equal(deburred, "Povodna faktura")
})

test('deburr can remove diacritic', () => {
	const lettersWithDiacritic = Object.keys(deburredLettersMap).join('')
	const expectedDeburredText = Object.values(deburredLettersMap).join('')
	assert.equal(expectedDeburredText, deburr(lettersWithDiacritic))
})

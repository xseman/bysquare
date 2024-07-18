import assert from "node:assert";
import test from "node:test";

import {deburr} from "./deburr.js";

test("deburr", () => {
	const deburred = deburr("Pôvodná faktúra")
	assert.equal(deburred, "Povodna faktura")
})

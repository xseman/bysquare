import assert from "node:assert";
import test, { describe } from "node:test";

import {
	decode,
	encode,
} from "./base32hex.js";

describe("base32hex encoding", () => {
	test("empty input", () => {
		const input = new Uint8Array([]);
		const output = encode(input);
		assert.equal(output, ""); // No padding in empty input
	});

	test("'f' (0x66)", () => {
		const input = new Uint8Array([0x66]);
		const output = encode(input);
		assert.equal(output, "CO======"); // 0x66 -> 1100110 -> CO with padding
	});

	test("'foobar' string", () => {
		const input = new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]);
		const output = encode(input);
		assert.equal(output, "CPNMUOJ1E8======"); // Encoded base32hex with padding
	});

	test("with no padding", () => {
		const input = new Uint8Array([0x66, 0x6f]);
		const output = encode(input, false);
		assert.equal(output, "CPNG"); // No padding
	});

	test("longer input", () => {
		const input = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
		const output = encode(input);
		assert.equal(output, "000G40O40K30===="); // Encoded base32hex with padding
	});
});

describe("base32hex decoding", () => {
	test("empty string", () => {
		const input = "";
		const output = decode(input);
		assert.deepEqual(output, new Uint8Array([])); // Empty array for empty input
	});

	test("'CO======'", () => {
		const input = "CO======";
		const output = decode(input);
		assert.deepEqual(output, new Uint8Array([0x66])); // 0x66 -> 1100110 -> CO
	});

	test("'foobar' string", () => {
		const input = "CPNMUOJ1E8======";
		const output = decode(input);
		assert.deepEqual(output, new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72])); // Decoded to 'foobar'
	});

	test("with no padding", () => {
		const input = "CPNM";
		const output = decode(input);
		assert.deepEqual(output, new Uint8Array([0x66, 0x6f])); // Correct decoding with no padding
	});

	test("with loose mode (lowercase and no padding)", () => {
		const input = "cpnm";
		const output = decode(input, true);
		assert.deepEqual(output, new Uint8Array([0x66, 0x6f])); // Loose decoding allows lowercase and auto-padding
	});

	test("invalid character", () => {
		assert.throws(() => {
			decode("CPNM!");
		}, { message: "Invalid base32hex string" }); // Invalid character should throw error
	});
});

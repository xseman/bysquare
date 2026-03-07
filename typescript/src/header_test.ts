import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	addChecksum,
	buildBysquareHeader,
	buildPayloadLength,
	decodeHeader,
	EncodeError,
	EncodeErrorMessage,
	MAX_COMPRESSED_SIZE,
} from "./header.js";
import { Version } from "./types.js";

describe("addChecksum", () => {
	test("returns Uint8Array with correct length", () => {
		const payload = "test\tpayload";
		const payloadBytes = new TextEncoder().encode(payload).length;

		const result = addChecksum(payload);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.byteLength).toBe(4 + payloadBytes);
	});

	test("first 4 bytes contain CRC32 checksum", () => {
		const payload = "test\tpayload";

		const result = addChecksum(payload);
		const checksumBytes = result.slice(0, 4);
		const checksum = new DataView(checksumBytes.buffer, checksumBytes.byteOffset, 4)
			.getUint32(0, true);

		expect(checksum).toBeGreaterThan(0);
		expect(checksum).toBeLessThanOrEqual(4_294_967_295);
	});

	test("remaining bytes match UTF-8 encoded input", () => {
		const payload = "test\tpayload";
		const expectedPayloadBytes = new TextEncoder().encode(payload);

		const result = addChecksum(payload);
		const payloadBytes = result.slice(4);

		expect(payloadBytes).toEqual(expectedPayloadBytes);
	});

	test("handles empty string", () => {
		const payload = "";

		const result = addChecksum(payload);

		expect(result.byteLength).toBe(4);
		expect(result.slice(4)).toEqual(new Uint8Array([]));
	});

	test("handles unicode characters", () => {
		const payload = "Žltý kôň úpel ďábelské ódy";
		const payloadBytes = new TextEncoder().encode(payload).length;

		const result = addChecksum(payload);

		expect(result.byteLength).toBe(4 + payloadBytes);
		const decodedPayload = new TextDecoder().decode(result.slice(4));
		expect(decodedPayload).toBe(payload);
	});

	test("different payloads produce different checksums", () => {
		const payload1 = "test1";
		const payload2 = "test2";

		const result1 = addChecksum(payload1);
		const result2 = addChecksum(payload2);

		const checksum1 = new DataView(result1.buffer, result1.byteOffset, 4)
			.getUint32(0, true);
		const checksum2 = new DataView(result2.buffer, result2.byteOffset, 4)
			.getUint32(0, true);

		expect(checksum1).not.toBe(checksum2);
	});
});

describe("buildBysquareHeader", () => {
	test("defaults to all zeros", () => {
		const expected = [0x00, 0x00];
		const result = buildBysquareHeader();
		expect(result).toEqual(expected);
	});

	test("encodes nibbles from binary data", () => {
		/** dprint-ignore */
		const inputData = [
			0b0000_0001, 0b0000_0010,
			0b0000_0011, 0b0000_0100,
		] as [number, number, number, number];

		const expected = [
			0b0001_0010,
			0b0011_0100,
		];

		const result = buildBysquareHeader(inputData);
		expect(result).toEqual(expected);
	});

	const invalidHeaderTestCases = [
		{
			name: "invalid type",
			input: [0xFF, Version["1.0.0"], 0x00, 0x00],
			error: EncodeErrorMessage.BySquareType,
		},
		{
			name: "invalid version",
			input: [0x00, 0xFF, 0x00, 0x00],
			error: EncodeErrorMessage.Version,
		},
		{
			name: "invalid document type",
			input: [0x00, 0x00, 0xFF, 0x00],
			error: EncodeErrorMessage.DocumentType,
		},
		{
			name: "invalid reserved nibble",
			input: [0x00, 0x00, 0x00, 0xFF],
			error: EncodeErrorMessage.Reserved,
		},
	];

	test.each(invalidHeaderTestCases)("throws for $name", ({ input, error }) => {
		expect(() => {
			buildBysquareHeader(input as [number, number, number, number]);
		}).toThrow(EncodeError);
	});
});

describe("decodeHeader", () => {
	test("decodes all-zero header", () => {
		const header = new Uint8Array([0x00, 0x00]);

		const result = decodeHeader(header);

		expect(result).toEqual({
			bysquareType: 0,
			version: 0,
			documentType: 0,
			reserved: 0,
		});
	});

	test("decodes pay header (bysquareType=0, version=0)", () => {
		const header = new Uint8Array([0x00, 0x00]);

		const result = decodeHeader(header);

		expect(result.bysquareType).toBe(0);
		expect(result.version).toBe(0);
	});

	test("decodes invoice header (bysquareType=1)", () => {
		const header = new Uint8Array([0x10, 0x00]);

		const result = decodeHeader(header);

		expect(result.bysquareType).toBe(1);
		expect(result.version).toBe(0);
		expect(result.documentType).toBe(0);
		expect(result.reserved).toBe(0);
	});

	test("decodes all nibbles at max value", () => {
		const header = new Uint8Array([0xFF, 0xFF]);

		const result = decodeHeader(header);

		expect(result.bysquareType).toBe(15);
		expect(result.version).toBe(15);
		expect(result.documentType).toBe(15);
		expect(result.reserved).toBe(15);
	});

	test("decodes individual nibble values", () => {
		const header = new Uint8Array([
			(0x01 << 4) | 0x02,
			(0x03 << 4) | 0x04,
		]);

		const result = decodeHeader(header);

		expect(result.bysquareType).toBe(1);
		expect(result.version).toBe(2);
		expect(result.documentType).toBe(3);
		expect(result.reserved).toBe(4);
	});

	test("round-trips with buildBysquareHeader", () => {
		/** dprint-ignore */
		const input: [number, number, number, number] = [
			0x01, 0x02,
			0x03, 0x04,
		];

		const encoded = buildBysquareHeader(input);
		const decoded = decodeHeader(new Uint8Array(encoded));

		expect(decoded.bysquareType).toBe(1);
		expect(decoded.version).toBe(2);
		expect(decoded.documentType).toBe(3);
		expect(decoded.reserved).toBe(4);
	});

	test("round-trips all valid nibble values", () => {
		for (let i = 0; i < 16; i++) {
			/** dprint-ignore */
			const input: [number, number, number, number] = [
				i, 0x00,
				0x00, 0x00,
			];

			const encoded = buildBysquareHeader(input);
			const decoded = decodeHeader(new Uint8Array(encoded));

			expect(decoded.bysquareType).toBe(i);
		}
	});
});

describe("buildPayloadLength", () => {
	test("encodes length as little-endian 16-bit", () => {
		const length = MAX_COMPRESSED_SIZE - 1;
		const dataView = new DataView(new ArrayBuffer(2));
		dataView.setUint16(0, length, true);

		const expected = new Uint8Array(dataView.buffer);
		const result = buildPayloadLength(length);

		expect(result).toEqual(expected);
	});

	test("throws for oversized payload", () => {
		expect(() => {
			buildPayloadLength(MAX_COMPRESSED_SIZE);
		}).toThrow(EncodeError);
	});

	test("encodes zero length", () => {
		const result = buildPayloadLength(0);
		expect(result).toEqual(new Uint8Array([0x00, 0x00]));
	});

	test("encodes small length correctly", () => {
		const result = buildPayloadLength(256);
		const view = new DataView(result.buffer, result.byteOffset, 2);
		expect(view.getUint16(0, true)).toBe(256);
	});
});

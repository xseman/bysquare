import { deepEqual, equal } from "node:assert/strict"

import {
	addChecksum,
	bysquareHeader,
	checksum,
	deserialize,
	generate
} from "./generate.js"
import { DataModel, PaymentOptions } from "./types.js"

export const qrData = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" }
			],
			currencyCode: "EUR",
			variableSymbol: "123"
		}
	]
} satisfies DataModel

const intermediate = /** dprint-ignore */ [
	"random-id",
	"\t", "1",
	"\t", "1",
	"\t", "100",
	"\t", "EUR",
	"\t",
	"\t", "123",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t", "1",
	"\t", "SK9611000000002918599669",
	"\t",
	"\t", "0",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("")

export function generating() {
	equal(
		generate(qrData),
		"0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000"
	)
}

export function tabbedString() {
	equal(deserialize(qrData), intermediate)
}

export function testChecksum() {
	deepEqual(
		checksum(intermediate),
		Buffer.from([0x90, 0x94, 0x19, 0x21])
	)
}

export function testCreateDataWithChecksum() {
	const checksum = addChecksum(qrData)
	// dprint-ignore
	const expected = Uint8Array.from([0x90, 0x94, 0x19, 0x21, 0x72, 0x61, 0x6e, 0x64, 0x6f, 0x6d, 0x2d, 0x69, 0x64, 0x09, 0x31, 0x09, 0x31, 0x09, 0x31, 0x30, 0x30, 0x09, 0x45, 0x55, 0x52, 0x09, 0x09, 0x31, 0x32, 0x33, 0x09, 0x09, 0x09, 0x09, 0x09, 0x31, 0x09, 0x53, 0x4b, 0x39, 0x36, 0x31, 0x31, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x39, 0x31, 0x38, 0x35, 0x39, 0x39, 0x36, 0x36, 0x39, 0x09, 0x09, 0x30, 0x09, 0x30, 0x09, 0x09, 0x09])

	deepEqual(checksum, expected)
}

export function testMakeBysquareHeader() {
	const header = bysquareHeader()
	const expected = Uint8Array.from([0x00, 0x00])

	deepEqual(header, expected)
}

export function binaryHeader() {
	deepEqual(
		bysquareHeader([0b0000_0001, 0b0000_0010, 0b0000_0011, 0b0000_0100]),
		Uint8Array.from([0b0001_0010, 0b0011_0100])
	)
}

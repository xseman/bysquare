import { deepEqual, equal } from 'node:assert/strict';

import {
	bysquareHeader,
	checksum,
	generate,
	prepareCompression,
	toIntermediate
} from "./generate.js";
import { DataModel, PaymentOptions } from "./types.js";

const model = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: "EUR",
			variableSymbol: "123",
		}
	]
} satisfies DataModel

const intermediate = [
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

export async function generating() {
	equal(
		await generate(model),
		"0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"
	)
}

export function tabbedString() {
	equal(toIntermediate(model), intermediate)
}

export function testChecksum() {
	deepEqual(
		checksum(intermediate),
		Buffer.from([0x90, 0x94, 0x19, 0x21])
	)
}

export function testCreateDataWithChecksum() {
	const checksum = prepareCompression(model)
	const expected = Buffer.from(
		"9094192172616e646f6d2d6964093109310931303009455552090931323309090909093109534b393631313030303030303030323931383539393636390909300930090909",
		"hex"
	)

	deepEqual(checksum, expected)
}


export function testMakeBysquareHeader() {
	const created = bysquareHeader()
	const expected = Buffer.from([0x00, 0x00])

	deepEqual(created, expected)
}


export function binaryHeader() {
	deepEqual(
		bysquareHeader([
			0b0000_0001, 0b0000_0010,
			0b0000_0011, 0b0000_0100
		]),
		Buffer.from([
			0b0001_0010,
			0b0011_0100
		])
	)
}

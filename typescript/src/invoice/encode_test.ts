import {
	describe,
	expect,
	test,
} from "bun:test";

import { decode } from "./decode.js";
import {
	encode,
	serialize,
} from "./encode.js";
import {
	buildInvoiceDataModel,
	FORSYS_INVOICE_ENCODED,
	FORSYS_INVOICE_FIXTURE,
	INVOICE_FIXTURE,
	INVOICE_SERIALIZED,
	INVOICE_WITH_ALL_FIELDS,
} from "./testdata/invoices.js";
import { InvoiceDocumentType } from "./types.js";

describe("serialize", () => {
	test("serializes basic invoice to expected tab-separated string", () => {
		const result = serialize(INVOICE_FIXTURE);
		expect(result).toBe(INVOICE_SERIALIZED);
	});

	test("field count is 40 + N*5 for single tax category", () => {
		const result = serialize(INVOICE_FIXTURE);
		const fields = result.split("\t");
		expect(fields.length).toBe(40 + 1 * 5);
	});

	test("field count is 40 + N*5 for multiple tax categories", () => {
		const result = serialize(INVOICE_WITH_ALL_FIELDS);
		const fields = result.split("\t");
		expect(fields.length).toBe(40 + 2 * 5);
	});

	test("tab characters in field values are replaced with spaces", () => {
		const model = buildInvoiceDataModel({
			invoiceDescription: "line1\tline2",
		});

		const result = serialize(model);
		const fields = result.split("\t");
		const descriptionIndex = 28;
		expect(fields[descriptionIndex]).toBe("line1 line2");
	});

	test("optional numeric fields serialize as empty when undefined", () => {
		const result = serialize(INVOICE_FIXTURE);
		const fields = result.split("\t");

		// currRate (index 7) and referenceCurrRate (index 8) should be empty
		expect(fields[7]).toBe("");
		expect(fields[8]).toBe("");
	});
});

describe("encode", () => {
	test("returns a non-empty base32hex string", () => {
		const result = encode(INVOICE_FIXTURE);

		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	test("output contains only base32hex characters", () => {
		const result = encode(INVOICE_FIXTURE);
		expect(result).toMatch(/^[0-9A-V]+$/);
	});

	test("encodes all 5 document types without error", () => {
		for (const docType of Object.values(InvoiceDocumentType)) {
			const model = buildInvoiceDataModel({ documentType: docType as InvoiceDocumentType });
			expect(() => encode(model)).not.toThrow();
		}
	});

	test("encodes invoice with all fields", () => {
		const result = encode(INVOICE_WITH_ALL_FIELDS);
		expect(result).toBeTruthy();
		expect(result.length).toBeGreaterThan(0);
	});

	test("skips validation when validate option is false", () => {
		const invalid = buildInvoiceDataModel({ invoiceId: "" });
		expect(() => encode(invalid, { validate: false })).not.toThrow();
	});

	test("encodes Forsys sample invoice with matching header", () => {
		const result = encode(FORSYS_INVOICE_FIXTURE, {
			validate: false,
		});

		// Header prefix must match (bysquareType=1, version=0, documentType=0)
		expect(result.substring(0, 4)).toBe(FORSYS_INVOICE_ENCODED.substring(0, 4));

		// LZMA compression is not bit-exact across implementations, so verify
		// via round-trip instead of exact string comparison
		const decoded = decode(result);
		expect(decoded.invoiceId).toBe(FORSYS_INVOICE_FIXTURE.invoiceId);
		expect(decoded.issueDate).toBe(FORSYS_INVOICE_FIXTURE.issueDate);
		expect(decoded.supplierParty.partyName).toBe(
			FORSYS_INVOICE_FIXTURE.supplierParty.partyName,
		);
		expect(decoded.customerParty.partyName).toBe(
			FORSYS_INVOICE_FIXTURE.customerParty.partyName,
		);
		expect(decoded.paymentMeans).toBe(FORSYS_INVOICE_FIXTURE.paymentMeans);
	});
});

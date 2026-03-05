import {
	describe,
	expect,
	test,
} from "bun:test";

import { ValidationError } from "../errors.js";
import { buildInvoiceDataModel } from "./testdata/invoices.js";
import { InvoiceDocumentType } from "./types.js";
import { validateDataModel } from "./validations.js";

describe("validateDataModel", () => {
	test("valid basic invoice passes validation", () => {
		const model = buildInvoiceDataModel();
		expect(() => validateDataModel(model)).not.toThrow();
	});

	test("valid invoice with all fields passes validation", () => {
		const model = buildInvoiceDataModel({
			taxPointDate: "20240115",
			foreignCurrencyCode: "USD",
			currRate: 1.08,
			referenceCurrRate: 1,
			numberOfInvoiceLines: undefined,
			singleInvoiceLine: {
				itemName: "Test item",
				invoicedQuantity: 5,
			},
		});
		expect(() => validateDataModel(model)).not.toThrow();
	});

	describe("required fields", () => {
		test("rejects empty invoiceId", () => {
			const model = buildInvoiceDataModel({ invoiceId: "" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects empty issueDate", () => {
			const model = buildInvoiceDataModel({ issueDate: "" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects empty localCurrencyCode", () => {
			const model = buildInvoiceDataModel({ localCurrencyCode: "" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects empty supplierParty.partyName", () => {
			const model = buildInvoiceDataModel({
				supplierParty: {
					partyName: "",
					postalAddress: {
						streetName: "Test",
						cityName: "City",
						postalZone: "12345",
						country: "SVK",
					},
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects empty customerParty.partyName", () => {
			const model = buildInvoiceDataModel({
				customerParty: { partyName: "" },
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("currency code format", () => {
		test("rejects invalid localCurrencyCode", () => {
			const model = buildInvoiceDataModel({ localCurrencyCode: "eu" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects localCurrencyCode with wrong length", () => {
			const model = buildInvoiceDataModel({ localCurrencyCode: "EURO" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("foreign currency group", () => {
		test("rejects foreignCurrencyCode without currRate", () => {
			const model = buildInvoiceDataModel({
				foreignCurrencyCode: "USD",
				currRate: undefined,
				referenceCurrRate: 1,
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects currRate without foreignCurrencyCode", () => {
			const model = buildInvoiceDataModel({
				foreignCurrencyCode: undefined,
				currRate: 1.08,
				referenceCurrRate: undefined,
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects invalid foreignCurrencyCode format", () => {
			const model = buildInvoiceDataModel({
				foreignCurrencyCode: "usd",
				currRate: 1.08,
				referenceCurrRate: 1,
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("supplier postal address", () => {
		test("rejects missing streetName", () => {
			const model = buildInvoiceDataModel({
				supplierParty: {
					partyName: "Test",
					postalAddress: {
						cityName: "City",
						postalZone: "12345",
						country: "SVK",
					},
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects invalid country code", () => {
			const model = buildInvoiceDataModel({
				supplierParty: {
					partyName: "Test",
					postalAddress: {
						streetName: "Street",
						cityName: "City",
						postalZone: "12345",
						country: "sk",
					},
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("invoice line choice", () => {
		test("rejects when both numberOfInvoiceLines and singleInvoiceLine are set", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: 3,
				singleInvoiceLine: { itemName: "Test" },
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects when neither numberOfInvoiceLines nor singleInvoiceLine is set", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: undefined,
				singleInvoiceLine: undefined,
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects non-positive numberOfInvoiceLines", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: 0,
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("single invoice line", () => {
		test("rejects when both itemName and itemEanCode are set", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: undefined,
				singleInvoiceLine: {
					itemName: "Test",
					itemEanCode: "1234567890123",
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects when neither itemName nor itemEanCode is set", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: undefined,
				singleInvoiceLine: {
					invoicedQuantity: 5,
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects inconsistent period dates (only from set)", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: undefined,
				singleInvoiceLine: {
					itemName: "Test",
					periodFromDate: "20240101",
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects periodFromDate after periodToDate", () => {
			const model = buildInvoiceDataModel({
				numberOfInvoiceLines: undefined,
				singleInvoiceLine: {
					itemName: "Test",
					periodFromDate: "20240201",
					periodToDate: "20240101",
				},
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});
	});

	describe("tax category summaries", () => {
		test("rejects empty taxCategorySummaries", () => {
			const model = buildInvoiceDataModel({
				taxCategorySummaries: [],
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects classifiedTaxCategory > 1", () => {
			const model = buildInvoiceDataModel({
				taxCategorySummaries: [{
					classifiedTaxCategory: 1.5,
					taxExclusiveAmount: 100,
					taxAmount: 15,
				}],
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects classifiedTaxCategory < 0", () => {
			const model = buildInvoiceDataModel({
				taxCategorySummaries: [{
					classifiedTaxCategory: -0.1,
					taxExclusiveAmount: 100,
					taxAmount: 10,
				}],
			});
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("accepts classifiedTaxCategory at boundaries (0 and 1)", () => {
			const model = buildInvoiceDataModel({
				taxCategorySummaries: [
					{ classifiedTaxCategory: 0, taxExclusiveAmount: 100, taxAmount: 0 },
					{ classifiedTaxCategory: 1, taxExclusiveAmount: 100, taxAmount: 100 },
				],
			});
			expect(() => validateDataModel(model)).not.toThrow();
		});
	});

	describe("date validation", () => {
		test("rejects invalid issueDate format", () => {
			const model = buildInvoiceDataModel({ issueDate: "2024-01-15" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("rejects invalid taxPointDate format", () => {
			const model = buildInvoiceDataModel({ taxPointDate: "not-a-date" });
			expect(() => validateDataModel(model)).toThrow(ValidationError);
		});

		test("accepts valid dates", () => {
			const model = buildInvoiceDataModel({
				issueDate: "20240229",
				taxPointDate: "20240229",
			});
			expect(() => validateDataModel(model)).not.toThrow();
		});
	});

	describe("all document types validate", () => {
		for (const [name, docType] of Object.entries(InvoiceDocumentType)) {
			test(`${name} passes validation`, () => {
				const model = buildInvoiceDataModel({
					documentType: docType as InvoiceDocumentType,
				});
				expect(() => validateDataModel(model)).not.toThrow();
			});
		}
	});
});

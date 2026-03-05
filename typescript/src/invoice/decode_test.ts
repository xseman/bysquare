import {
	describe,
	expect,
	test,
} from "bun:test";

import {
	decode,
	deserialize,
} from "./decode.js";
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
	ROUND_TRIP_INVOICE_TEST_CASES,
} from "./testdata/invoices.js";
import { InvoiceDocumentType } from "./types.js";

describe("deserialize", () => {
	test("deserializes basic invoice from tab-separated string", () => {
		const result = deserialize(INVOICE_SERIALIZED, InvoiceDocumentType.Invoice);

		expect(result.invoiceId).toBe("FV2024001");
		expect(result.issueDate).toBe("20240115");
		expect(result.localCurrencyCode).toBe("EUR");
		expect(result.supplierParty.partyName).toBe("Supplier s.r.o.");
		expect(result.customerParty.partyName).toBe("Customer a.s.");
		expect(result.numberOfInvoiceLines).toBe(3);
		expect(result.taxCategorySummaries).toHaveLength(1);
		expect(result.taxCategorySummaries[0].classifiedTaxCategory).toBe(0.2);
		expect(result.taxCategorySummaries[0].taxExclusiveAmount).toBe(100);
		expect(result.taxCategorySummaries[0].taxAmount).toBe(20);
	});

	test("deserializes undefined optional fields correctly", () => {
		const result = deserialize(INVOICE_SERIALIZED, InvoiceDocumentType.Invoice);

		expect(result.taxPointDate).toBeUndefined();
		expect(result.orderId).toBeUndefined();
		expect(result.foreignCurrencyCode).toBeUndefined();
		expect(result.currRate).toBeUndefined();
		expect(result.referenceCurrRate).toBeUndefined();
		expect(result.supplierParty.contact).toBeUndefined();
		expect(result.singleInvoiceLine).toBeUndefined();
		expect(result.paymentMeans).toBeUndefined();
	});

	test("round-trips serialize/deserialize for basic fixture", () => {
		const serialized = serialize(INVOICE_FIXTURE);
		const deserialized = deserialize(serialized, InvoiceDocumentType.Invoice);

		expect(deserialized.invoiceId).toBe(INVOICE_FIXTURE.invoiceId);
		expect(deserialized.issueDate).toBe(INVOICE_FIXTURE.issueDate);
		expect(deserialized.localCurrencyCode).toBe(INVOICE_FIXTURE.localCurrencyCode);
		expect(deserialized.numberOfInvoiceLines).toBe(INVOICE_FIXTURE.numberOfInvoiceLines);
	});
});

describe("decode", () => {
	test("round-trips encode/decode for all test cases", () => {
		for (const fixture of ROUND_TRIP_INVOICE_TEST_CASES) {
			const model = structuredClone(fixture);
			const encoded = encode(model, { validate: false });
			const decoded = decode(encoded);

			expect(decoded.documentType).toBe(fixture.documentType);
			expect(decoded.invoiceId).toBe(fixture.invoiceId);
			expect(decoded.issueDate).toBe(fixture.issueDate);
			expect(decoded.localCurrencyCode).toBe(fixture.localCurrencyCode);
			expect(decoded.supplierParty.partyName).toBe(fixture.supplierParty.partyName);
			expect(decoded.customerParty.partyName).toBe(fixture.customerParty.partyName);
			expect(decoded.taxCategorySummaries.length).toBe(fixture.taxCategorySummaries.length);
		}
	});

	test("round-trip preserves all fields for full invoice", () => {
		const original = structuredClone(buildInvoiceDataModel({
			documentType: InvoiceDocumentType.Invoice,
			invoiceId: "RT001",
			issueDate: "20240301",
			taxPointDate: "20240301",
			orderId: "ORD-123",
			deliveryNoteId: "DN-456",
			localCurrencyCode: "EUR",
			foreignCurrencyCode: "USD",
			currRate: 1.08,
			referenceCurrRate: 1,
			supplierParty: {
				partyName: "Test Supplier",
				companyTaxId: "1111111111",
				companyVatId: "SK1111111111",
				companyRegisterId: "REG001",
				postalAddress: {
					streetName: "Main St",
					buildingNumber: "42",
					cityName: "Bratislava",
					postalZone: "81101",
					state: "BA",
					country: "SVK",
				},
				contact: {
					name: "Contact Person",
					telephone: "+421900000000",
					email: "contact@test.sk",
				},
			},
			customerParty: {
				partyName: "Test Customer",
				companyTaxId: "2222222222",
				companyVatId: "SK2222222222",
				companyRegisterId: "REG002",
				partyIdentification: "CUST-X",
			},
			numberOfInvoiceLines: undefined,
			invoiceDescription: "Full test invoice",
			singleInvoiceLine: {
				orderLineId: "OL1",
				deliveryNoteLineId: "DNL1",
				itemName: "Service",
				periodFromDate: "20240101",
				periodToDate: "20240131",
				invoicedQuantity: 80,
			},
			taxCategorySummaries: [
				{
					classifiedTaxCategory: 0.2,
					taxExclusiveAmount: 5000,
					taxAmount: 1000,
					alreadyClaimedTaxExclusiveAmount: 1000,
					alreadyClaimedTaxAmount: 200,
				},
			],
			monetarySummary: {
				payableRoundingAmount: 0.5,
				paidDepositsAmount: 500,
			},
			paymentMeans: 3,
		}));

		const encoded = encode(original, { validate: false });
		const decoded = decode(encoded);

		expect(decoded.documentType).toBe(original.documentType);
		expect(decoded.invoiceId).toBe(original.invoiceId);
		expect(decoded.issueDate).toBe(original.issueDate);
		expect(decoded.taxPointDate).toBe(original.taxPointDate);
		expect(decoded.orderId).toBe(original.orderId);
		expect(decoded.deliveryNoteId).toBe(original.deliveryNoteId);
		expect(decoded.localCurrencyCode).toBe(original.localCurrencyCode);
		expect(decoded.foreignCurrencyCode).toBe(original.foreignCurrencyCode);
		expect(decoded.currRate).toBe(original.currRate);
		expect(decoded.referenceCurrRate).toBe(original.referenceCurrRate);

		expect(decoded.supplierParty.partyName).toBe(original.supplierParty.partyName);
		expect(decoded.supplierParty.companyTaxId).toBe(original.supplierParty.companyTaxId);
		expect(decoded.supplierParty.postalAddress.streetName).toBe(
			original.supplierParty.postalAddress.streetName,
		);
		expect(decoded.supplierParty.postalAddress.country).toBe(
			original.supplierParty.postalAddress.country,
		);
		expect(decoded.supplierParty.contact?.name).toBe(original.supplierParty.contact?.name);
		expect(decoded.supplierParty.contact?.email).toBe(original.supplierParty.contact?.email);

		expect(decoded.customerParty.partyName).toBe(original.customerParty.partyName);
		expect(decoded.customerParty.partyIdentification).toBe(
			original.customerParty.partyIdentification,
		);

		expect(decoded.invoiceDescription).toBe(original.invoiceDescription);
		expect(decoded.singleInvoiceLine?.itemName).toBe(original.singleInvoiceLine?.itemName);
		expect(decoded.singleInvoiceLine?.invoicedQuantity).toBe(
			original.singleInvoiceLine?.invoicedQuantity,
		);

		expect(decoded.taxCategorySummaries[0].classifiedTaxCategory).toBe(0.2);
		expect(decoded.taxCategorySummaries[0].taxExclusiveAmount).toBe(5000);
		expect(decoded.taxCategorySummaries[0].alreadyClaimedTaxExclusiveAmount).toBe(1000);

		expect(decoded.monetarySummary.payableRoundingAmount).toBe(0.5);
		expect(decoded.monetarySummary.paidDepositsAmount).toBe(500);
		expect(decoded.paymentMeans).toBe(3);
	});

	test("rejects QR string with bysquareType != 1", () => {
		const payModel = {
			invoiceId: "",
			payments: [{
				type: 1,
				amount: 100,
				currencyCode: "EUR",
				bankAccounts: [{ iban: "SK9611000000002918599669" }],
				beneficiary: { name: "Test" },
			}],
		};

		// Use the pay encoder to create a valid bysquareType=0 QR code
		const { encode } = require("../pay/encode.js");
		const payQr = encode(payModel);

		expect(() => decode(payQr)).toThrow("Expected bysquareType 1");
	});

	test("decodes Forsys sample invoice from known QR string", () => {
		const decoded = decode(FORSYS_INVOICE_ENCODED);

		expect(decoded.documentType).toBe(FORSYS_INVOICE_FIXTURE.documentType);
		expect(decoded.invoiceId).toBe("201300001");
		expect(decoded.issueDate).toBe("20130227");
		expect(decoded.taxPointDate).toBe("20130227");
		expect(decoded.localCurrencyCode).toBe("EUR");
		expect(decoded.supplierParty.partyName).toBe("Forsys a. s.");
		expect(decoded.supplierParty.companyTaxId).toBe("2022683003");
		expect(decoded.supplierParty.postalAddress.streetName).toBe("Zochova");
		expect(decoded.supplierParty.postalAddress.country).toBe("SVK");
		expect(decoded.supplierParty.contact?.email).toBe("info@bysquare.com");
		expect(decoded.customerParty.partyName).toBe("Slovensk\u00e1 bankov\u00e1 asoci\u00e1cia");
		expect(decoded.singleInvoiceLine?.itemName).toBe(
			"Vzorov\u00e1 fakt\u00fara pre \u0161tandard by square",
		);
		expect(decoded.singleInvoiceLine?.invoicedQuantity).toBe(1);
		expect(decoded.taxCategorySummaries).toHaveLength(1);
		expect(decoded.taxCategorySummaries[0].classifiedTaxCategory).toBe(0.2);
		expect(decoded.taxCategorySummaries[0].taxExclusiveAmount).toBe(1);
		expect(decoded.taxCategorySummaries[0].taxAmount).toBe(0.2);
		expect(decoded.paymentMeans).toBe(1);
	});
});

import {
	type DataModel,
	InvoiceDocumentType,
	PaymentMean,
	type SupplierParty,
	type TaxCategorySummary,
} from "../types.js";

export function buildSupplierParty(overrides?: Partial<SupplierParty>): SupplierParty {
	return {
		partyName: "Supplier s.r.o.",
		companyTaxId: "2020123456",
		companyVatId: "SK2020123456",
		companyRegisterId: "36000000",
		postalAddress: {
			streetName: "Hlavna",
			buildingNumber: "1",
			cityName: "Bratislava",
			postalZone: "81101",
			country: "SVK",
		},
		...overrides,
	};
}

export function buildTaxCategorySummary(
	overrides?: Partial<TaxCategorySummary>,
): TaxCategorySummary {
	return {
		classifiedTaxCategory: 0.2,
		taxExclusiveAmount: 100,
		taxAmount: 20,
		...overrides,
	};
}

export function buildInvoiceDataModel(
	overrides?: Partial<DataModel>,
): DataModel {
	return {
		documentType: InvoiceDocumentType.Invoice,
		invoiceId: "FV2024001",
		issueDate: "20240115",
		localCurrencyCode: "EUR",
		supplierParty: buildSupplierParty(),
		customerParty: {
			partyName: "Customer a.s.",
		},
		numberOfInvoiceLines: 3,
		taxCategorySummaries: [buildTaxCategorySummary()],
		monetarySummary: {},
		...overrides,
	};
}

export const INVOICE_FIXTURE: DataModel = buildInvoiceDataModel();

export const INVOICE_WITH_SINGLE_LINE: DataModel = buildInvoiceDataModel({
	numberOfInvoiceLines: undefined,
	singleInvoiceLine: {
		itemName: "Consulting services",
		invoicedQuantity: 10,
	},
});

export const INVOICE_WITH_FOREIGN_CURRENCY: DataModel = buildInvoiceDataModel({
	foreignCurrencyCode: "USD",
	currRate: 1.08,
	referenceCurrRate: 1,
});

export const INVOICE_WITH_ALL_FIELDS: DataModel = buildInvoiceDataModel({
	taxPointDate: "20240115",
	orderId: "OBJ001",
	deliveryNoteId: "DL001",
	foreignCurrencyCode: "USD",
	currRate: 1.08,
	referenceCurrRate: 1,
	supplierParty: buildSupplierParty({
		contact: {
			name: "Jan Novak",
			telephone: "+421900000000",
			email: "jan@supplier.sk",
		},
	}),
	customerParty: {
		partyName: "Customer a.s.",
		companyTaxId: "3030654321",
		companyVatId: "SK3030654321",
		companyRegisterId: "47000000",
		partyIdentification: "CUST-001",
	},
	numberOfInvoiceLines: undefined,
	invoiceDescription: "Invoice for consulting",
	singleInvoiceLine: {
		orderLineId: "L001",
		deliveryNoteLineId: "DL-L001",
		itemName: "Consulting",
		periodFromDate: "20240101",
		periodToDate: "20240131",
		invoicedQuantity: 160,
	},
	taxCategorySummaries: [
		{
			classifiedTaxCategory: 0.2,
			taxExclusiveAmount: 8000,
			taxAmount: 1600,
			alreadyClaimedTaxExclusiveAmount: 2000,
			alreadyClaimedTaxAmount: 400,
		},
		{
			classifiedTaxCategory: 0,
			taxExclusiveAmount: 500,
			taxAmount: 0,
		},
	],
	monetarySummary: {
		payableRoundingAmount: 0.01,
		paidDepositsAmount: 1000,
	},
	paymentMeans: PaymentMean.MoneyTransfer | PaymentMean.Cash,
});

export const PROFORMA_INVOICE_FIXTURE: DataModel = buildInvoiceDataModel({
	documentType: InvoiceDocumentType.ProformaInvoice,
	invoiceId: "PF2024001",
});

export const CREDIT_NOTE_FIXTURE: DataModel = buildInvoiceDataModel({
	documentType: InvoiceDocumentType.CreditNote,
	invoiceId: "CN2024001",
});

export const DEBIT_NOTE_FIXTURE: DataModel = buildInvoiceDataModel({
	documentType: InvoiceDocumentType.DebitNote,
	invoiceId: "DN2024001",
});

export const ADVANCE_INVOICE_FIXTURE: DataModel = buildInvoiceDataModel({
	documentType: InvoiceDocumentType.AdvanceInvoice,
	invoiceId: "ZF2024001",
});

/**
 * Expected tab-separated serialization of INVOICE_FIXTURE.
 *
 * Field order (40 + 1×5 = 45 fields):
 * invoiceId, issueDate, taxPointDate, orderId, deliveryNoteId,
 * localCurrencyCode, foreignCurrencyCode, currRate, referenceCurrRate,
 * supplier(4+6+3=13), customer(5), numberOfInvoiceLines, invoiceDescription,
 * singleInvoiceLine(7), taxCount, taxSummary(5), monetarySummary(2), paymentMeans
 */
export const INVOICE_SERIALIZED = [
	"FV2024001", // invoiceId
	"20240115", // issueDate
	"", // taxPointDate
	"", // orderId
	"", // deliveryNoteId
	"EUR", // localCurrencyCode
	"", // foreignCurrencyCode
	"", // currRate
	"", // referenceCurrRate
	// Supplier party
	"Supplier s.r.o.", // partyName
	"2020123456", // companyTaxId
	"SK2020123456", // companyVatId
	"36000000", // companyRegisterId
	"Hlavna", // streetName
	"1", // buildingNumber
	"Bratislava", // cityName
	"81101", // postalZone
	"", // state
	"SVK", // country
	"", // contact.name
	"", // contact.telephone
	"", // contact.email
	// Customer party
	"Customer a.s.", // partyName
	"", // companyTaxId
	"", // companyVatId
	"", // companyRegisterId
	"", // partyIdentification
	// Invoice detail
	"3", // numberOfInvoiceLines
	"", // invoiceDescription
	// Single invoice line (all empty)
	"", // orderLineId
	"", // deliveryNoteLineId
	"", // itemName
	"", // itemEanCode
	"", // periodFromDate
	"", // periodToDate
	"", // invoicedQuantity
	// Tax category summaries
	"1", // count
	"0.2", // classifiedTaxCategory
	"100", // taxExclusiveAmount
	"20", // taxAmount
	"", // alreadyClaimedTaxExclusiveAmount
	"", // alreadyClaimedTaxAmount
	// Monetary summary
	"", // payableRoundingAmount
	"", // paidDepositsAmount
	// Payment means
	"", // paymentMeans
].join("\t");

/**
 * Real-world sample invoice from the by square specification.
 * Known encoded form used for round-trip validation.
 */
export const FORSYS_INVOICE_FIXTURE: DataModel = {
	documentType: InvoiceDocumentType.Invoice,
	invoiceId: "201300001",
	issueDate: "20130227",
	taxPointDate: "20130227",
	localCurrencyCode: "EUR",
	supplierParty: {
		partyName: "Forsys a. s.",
		companyTaxId: "2022683003",
		companyVatId: "SK2022683003",
		companyRegisterId: "44232730",
		postalAddress: {
			streetName: "Zochova",
			buildingNumber: "6",
			cityName: "Bratislava",
			postalZone: "81103",
			country: "SVK",
		},
		contact: {
			email: "info@bysquare.com",
		},
	},
	customerParty: {
		partyName: "Slovensk\u00e1 bankov\u00e1 asoci\u00e1cia",
		companyTaxId: "2020809978",
		companyVatId: "SK2020809978",
		companyRegisterId: "30813182",
	},
	singleInvoiceLine: {
		itemName: "Vzorov\u00e1 fakt\u00fara pre \u0161tandard by square",
		invoicedQuantity: 1,
	},
	taxCategorySummaries: [
		{
			classifiedTaxCategory: 0.2,
			taxExclusiveAmount: 1,
			taxAmount: 0.2,
			alreadyClaimedTaxExclusiveAmount: 0,
			alreadyClaimedTaxAmount: 0,
		},
	],
	monetarySummary: {
		payableRoundingAmount: 0,
		paidDepositsAmount: 0,
	},
	paymentMeans: PaymentMean.MoneyTransfer,
};

export const FORSYS_INVOICE_ENCODED = "200180806I611JMHJL33BT4VB565SUTB108DFEOVDB5GL3VU6C1ALGC208QS9BJA8GRIAOK44IH6JGNH40V0NDM7AGKEUO6BCLOTVQJ8NBGRFAGD1M7BH5LO6TORMBCP1EIE7LD22UAKUCM207GT21MG2V09JTGHOIGLN62OABJV5PI6B72V69ION5SCQ38BCFNEQFTDMSLHF62IPOE8LJB9SU4ITV2U07FKCDH30RDN18UPAS69SRU95OF4SC7E14NGEUD7KKUH15VM4P6E1GQH25I1GDSRF5C8DGHQIGB340N6SN2UJUJ7R2D9IJBI4V50IKPT";

export const ROUND_TRIP_INVOICE_TEST_CASES: DataModel[] = [
	INVOICE_FIXTURE,
	INVOICE_WITH_SINGLE_LINE,
	INVOICE_WITH_FOREIGN_CURRENCY,
	INVOICE_WITH_ALL_FIELDS,
	PROFORMA_INVOICE_FIXTURE,
	CREDIT_NOTE_FIXTURE,
	DEBIT_NOTE_FIXTURE,
	ADVANCE_INVOICE_FIXTURE,
	FORSYS_INVOICE_FIXTURE,
];

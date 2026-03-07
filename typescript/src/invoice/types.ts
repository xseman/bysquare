/**
 * Invoice document types within bysquareType=1.
 *
 * @dprint-ignore
 */
export const InvoiceDocumentType = {
	Invoice:         0x00,
	ProformaInvoice: 0x01,
	CreditNote:      0x02,
	DebitNote:       0x03,
	AdvanceInvoice:  0x04,
} as const;

export type InvoiceDocumentType = typeof InvoiceDocumentType[keyof typeof InvoiceDocumentType];

/**
 * Payment means as bitmask values. Multiple values can be combined with
 * bitwise OR.
 *
 * Each value corresponds to `1 << position` where position is the
 * zero-based declaration order defined in the specification.
 *
 * @dprint-ignore
 */
export const PaymentMean = {
	MoneyTransfer:  0b0000001,
	Cash:           0b0000010,
	CashOnDelivery: 0b0000100,
	CreditCard:     0b0001000,
	Advance:        0b0010000,
	MutualOffset:   0b0100000,
	Other:          0b1000000,
} as const;

export type PaymentMean = typeof PaymentMean[keyof typeof PaymentMean];

export type Contact = {
	name?: string;
	telephone?: string;
	email?: string;
};

export type PostalAddress = {
	streetName?: string;
	buildingNumber?: string;
	cityName?: string;
	postalZone?: string;
	state?: string;
	country?: string;
};

export type Party = {
	partyName: string;
	companyTaxId?: string;
	companyVatId?: string;
	companyRegisterId?: string;
};

export type SupplierParty = Party & {
	postalAddress: PostalAddress;
	contact?: Contact;
};

export type CustomerParty = Party & {
	partyIdentification?: string;
};

export type SingleInvoiceLine = {
	orderLineId?: string;
	deliveryNoteLineId?: string;
	itemName?: string;
	itemEanCode?: string;
	/** YYYYMMDD */
	periodFromDate?: string;
	/** YYYYMMDD */
	periodToDate?: string;
	invoicedQuantity?: number;
};

export type TaxCategorySummary = {
	/** Decimal in range [0, 1] representing the tax rate */
	classifiedTaxCategory: number;
	taxExclusiveAmount: number;
	taxAmount: number;
	alreadyClaimedTaxExclusiveAmount?: number;
	alreadyClaimedTaxAmount?: number;
};

export type MonetarySummary = {
	payableRoundingAmount?: number;
	paidDepositsAmount?: number;
};

export type DataModel = {
	documentType: InvoiceDocumentType;
	/** Required invoice identifier */
	invoiceId: string;
	/** Required issue date in YYYYMMDD format */
	issueDate: string;
	/** YYYYMMDD */
	taxPointDate?: string;
	orderId?: string;
	deliveryNoteId?: string;
	/** ISO 4217 currency code */
	localCurrencyCode: string;
	/** ISO 4217 currency code, required if currRate is set */
	foreignCurrencyCode?: string;
	currRate?: number;
	referenceCurrRate?: number;
	supplierParty: SupplierParty;
	customerParty: CustomerParty;
	/**
	 * Mutually exclusive with singleInvoiceLine. Exactly one of
	 * numberOfInvoiceLines or singleInvoiceLine must be provided.
	 */
	numberOfInvoiceLines?: number;
	invoiceDescription?: string;
	/**
	 * Mutually exclusive with numberOfInvoiceLines. Exactly one of
	 * numberOfInvoiceLines or singleInvoiceLine must be provided.
	 */
	singleInvoiceLine?: SingleInvoiceLine;
	taxCategorySummaries: TaxCategorySummary[];
	monetarySummary: MonetarySummary;
	/** Bitmask of PaymentMean values */
	paymentMeans?: number;
};

/**
 * Months represented as bitwise flags, enabling multiple months to be combined
 * (via bitwise OR) into a single numeric value. Each month is a power of two,
 * so any combination of months produces a unique sum when you bitwise-OR
 * their values.
 *
 * @see Appendix A, Table 10
 * @see 3.7.
 * @dprint-ignore
 */
export const Month = {
	January:   0b00000000000001,
	February:  0b00000000000010,
	March:     0b00000000000100,
	April:     0b00000000001000,
	May:       0b00000000010000,
	June:      0b00000000100000,
	July:      0b00000001000000,
	August:    0b00000010000000,
	September: 0b00000100000000,
	October:   0b00001000000000,
	November:  0b00010000000000,
	December:  0b00100000000000,
} as const;

// Add type for enum-like usage
export type Month = typeof Month[keyof typeof Month];

/**
 * Payment day derived from the periodicity. Day of the month is a number
 * between 1 and 31. Day of the week is a number between 1 and 7 (1 = Monday,
 * 2 = Tuesday, …, 7 = Sunday).
 *
 * @see Appendix A, Table 9
 * @dprint-ignore
 */
export const Periodicity = {
	Daily:        "d",
	Weekly:       "w",
	Biweekly:     "b",
	Monthly:      "m",
	Bimonthly:    "B",
	Quarterly:    "q",
	Semiannually: "s",
	Annually:     "a",
} as const;

// Add type for enum-like usage
export type Periodicity = typeof Periodicity[keyof typeof Periodicity];

/**
 * This is the payment day. It's meaning depends on the periodicity, meaning
 * either day of the month (number between 1 and 31) or day of the week
 * (1=Monday, 2=Tuesday, …, 7=Sunday).
 *
 * @see Table 15 field #16
 * @see 2.5.
 * @minimum 1
 * @maximum 31
 * @maxLength 2
 */
export type Day =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31;

/**
 * Payment options classifier. Can be combined by summing values. At least
 * one option must be specified:
 *
 * - `PaymentOrder`: Single payment order
 * - `StandingOrder`: Standing order (recurring payment), details in StandingOrderExt
 * - `DirectDebit`: Direct debit, details in DirectDebitExt
 *
 * @see Appendix A, Table 11
 * @see Table 15 field #3
 * @see 2.1.
 */
export const PaymentOptions = {
	/**
	 * Single payment order
	 */
	PaymentOrder: 0b00000001,

	/**
	 * Standing order (recurring payment), details filled in StandingOrderExt
	 */
	StandingOrder: 0b00000010,

	/**
	 * Direct debit, details filled in DirectDebitExt
	 */
	DirectDebit: 0b00000100,
} as const;

// Add type for enum-like usage
export type PaymentOptions = typeof PaymentOptions[keyof typeof PaymentOptions];

/**
 * Bank account data of the payment recipient.
 *
 * @see Table 15 fields #13-14
 */
export type BankAccount = {
	/**
	 * International Bank Account Number in IBAN format.
	 *
	 * @see Table 15 field #13
	 * @see Table 8
	 * @example "SK8209000000000011424060"
	 * @pattern [A-Z]{2}[0-9]{2}[A-Z0-9]{0,30}
	 * @minLength 15
	 * @maxLength 34
	 */
	iban: string;

	/**
	 * Bank Identification Code (BIC) in ISO 9362 format (SWIFT).
	 *
	 * @see Table 15 field #14
	 * @see Table 8
	 * @example "TATRSKBX"
	 * @pattern [A-Z]{4}[A-Z]{2}[A-Z\d]{2}([A-Z\d]{3})?
	 * @minLength 8
	 * @maxLength 11
	 */
	bic?: string;
};

/**
 * Direct debit scheme. One of the following options:
 *
 * - SEPA - Direct debit follows the SEPA scheme
 * - Other - Other scheme
 *
 * @see Appendix A, Table 13
 * @see Table 15 field #21
 */
export const DirectDebitScheme = {
	/**
	 * Other scheme
	 */
	Other: 0x00,

	/**
	 * SEPA - Direct debit follows the SEPA scheme
	 */
	Sepa: 0x01,
} as const;

// Add type for enum-like usage
export type DirectDebitScheme = typeof DirectDebitScheme[keyof typeof DirectDebitScheme];

/**
 * Direct debit type. One of the following options:
 *
 * - one-off: One-time direct debit
 * - recurrent: Recurring direct debit
 *
 * @see Appendix A, Table 12
 * @see Table 15 field #22
 * @minimum 0
 * @maximum 1
 */
export const DirectDebitType = {
	/**
	 * One-time direct debit
	 */
	OneOff: 0x00,

	/**
	 * Recurring direct debit
	 */
	Recurrent: 0x01,
} as const;

// Add type for enum-like usage
export type DirectDebitType = typeof DirectDebitType[keyof typeof DirectDebitType];

export type Beneficiary = {
	/**
	 * Beneficiary name. Added in v1.1.0, required since v1.2.0.
	 *
	 * @see Table 15 field #31
	 * @maxLength 70
	 */
	name: string;

	/**
	 * Beneficiary street address.
	 *
	 * @see Table 15 field #32
	 * @maxLength 70
	 */
	street?: string;

	/**
	 * Beneficiary city.
	 *
	 * @see Table 15 field #33
	 * @maxLength 70
	 */
	city?: string;
};

export type SimplePayment = {
	/**
	 * Payment amount. Only positive values are allowed. The decimal part is
	 * separated by a dot. Can be left empty, e.g., for voluntary donations.
	 *
	 * @see Table 15 field #4
	 * @see Table 8
	 * @example 1000
	 * @example 1.99
	 * @example 10.5
	 * @example 0.08
	 * @minimum 0
	 * @maximum 999_999_999_999_999
	 * @maxLength 15
	 */
	amount?: number;

	/**
	 * Currency code in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) format (3 letters).
	 *
	 * @see Table 15 field #5
	 * @see Table 8
	 * @example "EUR"
	 * @pattern [A-Z]{3}
	 * @minLength 3
	 * @maxLength 3
	 */
	currencyCode: string | keyof typeof CurrencyCode;

	/**
	 * Payment due date in YYYYMMDD format. For standing orders, this indicates
	 * the first payment date.
	 *
	 * @see Table 15 field #6
	 * @see 3.7.
	 * @format date
	 * @example "20241231"
	 * @pattern \d{8}
	 * @maxLength 8
	 */
	paymentDueDate?: string;

	/**
	 * Variable symbol, up to 10 digits.
	 *
	 * @see Table 15 field #7
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	variableSymbol?: string;

	/**
	 * Constant symbol, a 4-digit payment identifier defined by NBS
	 * (National Bank of Slovakia).
	 *
	 * @see Table 15 field #8
	 * @pattern [0-9]{0,4}
	 * @maxLength 4
	 */
	constantSymbol?: string;

	/**
	 * Specific symbol, up to 10 digits.
	 *
	 * @see Table 15 field #9
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	specificSymbol?: string;

	/**
	 * Originator's reference information according to SEPA.
	 *
	 * @see Table 15 field #10
	 * @maxLength 35
	 */
	originatorsReferenceInformation?: string;

	/**
	 * Payment note for the recipient. Contains payment details that help the
	 * recipient identify the payment.
	 *
	 * @see Table 15 field #11
	 * @see Table 14
	 * @maxLength 140
	 */
	paymentNote?: string;

	/**
	 * List of bank accounts of the payment recipient.
	 *
	 * @see Table 15 fields #12-14
	 * @see 2.2.
	 * @minItems 1
	 */
	bankAccounts: BankAccount[];

	/**
	 * Beneficiary information. Added in v1.1.0, name required since v1.2.0.
	 *
	 * @see Table 15 fields #31-33
	 * @see Appendix E
	 */
	beneficiary: Beneficiary;
};

export type PaymentOrder = SimplePayment & {
	/**
	 * @see Table 15 field #3
	 */
	type: typeof PaymentOptions.PaymentOrder;
};

/**
 * Extension of payment data with standing order (recurring payment) settings.
 *
 * @see Table 15 fields #15-19
 * @see 2.5.
 */
export type StandingOrder = SimplePayment & {
	/**
	 * @see Table 15 field #3
	 */
	type: typeof PaymentOptions.StandingOrder;

	/**
	 * Specifies the day on which the standing order will be processed in the
	 * specified months.
	 *
	 * @see Table 15 field #16
	 * @minimum 1
	 * @maximum 31
	 * @maxLength 2
	 */
	day?: number | Day;

	/**
	 * Specifies the months in which the standing order payment should be
	 * executed. Multiple months are combined by summing their classifier values.
	 *
	 * @see Table 15 field #17
	 * @see Appendix A, Table 10
	 * @example Month.January
	 * @example Month.January | Month.July | Month.October
	 * @example 577
	 * @maxLength 4
	 */
	month?: keyof typeof Month | number;

	/**
	 * Periodicity (frequency) of the standing order.
	 *
	 * @see Table 15 field #18
	 * @see Appendix A, Table 9
	 * @maxLength 1
	 */
	periodicity: keyof typeof Periodicity | string;

	/**
	 * Last payment date within the standing order. After this date, the
	 * standing order is cancelled.
	 *
	 * @see Table 15 field #19
	 * @format date
	 * @pattern \d{8}
	 * @maxLength 8
	 * @example "20241231"
	 */
	lastDate?: string;
};

/**
 * Extension of payment data with direct debit settings and identification.
 *
 * @see Table 15 fields #20-30
 * @see 2.6.
 */
export type DirectDebit = SimplePayment & {
	/**
	 * @see Table 15 field #3
	 */
	type: typeof PaymentOptions.DirectDebit;

	/**
	 * Direct debit scheme.
	 *
	 * @see Table 15 field #21
	 * @see Appendix A, Table 13
	 * @example DirectDebitScheme.Sepa
	 * @minimum 0
	 * @maximum 1
	 */
	directDebitScheme?: keyof typeof DirectDebitScheme | number;

	/**
	 * Direct debit type.
	 *
	 * @see Table 15 field #22
	 * @see Appendix A, Table 12
	 * @example DirectDebitType.Recurrent
	 * @minimum 0
	 * @maximum 1
	 */
	directDebitType?: keyof typeof DirectDebitType | number;

	/**
	 * Variable symbol for direct debit extension (separate from base payment).
	 *
	 * @see Table 15 field #23
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	ddVariableSymbol?: string;

	/**
	 * Specific symbol for direct debit extension (separate from base payment).
	 *
	 * @see Table 15 field #24
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	ddSpecificSymbol?: string;

	/**
	 * Originator's reference information for direct debit extension (separate from base payment).
	 *
	 * @see Table 15 field #25
	 * @maxLength 35
	 */
	ddOriginatorsReferenceInformation?: string;

	/**
	 * Mandate identification between creditor and debtor according to SEPA.
	 *
	 * @see Table 15 field #26
	 * @maxLength 35
	 */
	mandateId?: string;

	/**
	 * Creditor identification according to SEPA.
	 *
	 * @see Table 15 field #27
	 * @maxLength 35
	 */
	creditorId?: string;

	/**
	 * Contract identification between creditor and debtor according to SEPA.
	 *
	 * @see Table 15 field #28
	 * @maxLength 35
	 */
	contractId?: string;

	/**
	 * Maximum direct debit amount.
	 *
	 * @see Table 15 field #29
	 * @minimum 0
	 * @maximum 999_999_999_999_999
	 * @maxLength 15
	 */
	maxAmount?: number;

	/**
	 * Direct debit validity date. The direct debit expires on this date.
	 *
	 * @see Table 15 field #30
	 * @format date
	 * @pattern \d{8}
	 * @maxLength 8
	 * @example "20241231"
	 */
	validTillDate?: string;
};

/**
 * Data for a single payment order.
 *
 * @see 4.
 */
export type Payment = PaymentOrder | StandingOrder | DirectDebit;

/**
 * PAY by square data model.
 *
 * @see 4.
 * @see Table 15
 */
export type DataModel = {
	/**
	 * Invoice number if the data is part of an invoice, or an identifier for
	 * the issuer's internal purposes.
	 *
	 * @see Table 15 field #1
	 * @maxLength 10
	 */
	invoiceId?: string;

	/**
	 * List of one or more payments for batch payment orders.
	 * The main (preferred) payment should be listed first.
	 *
	 * @see Table 15 field #2
	 * @minItems 1
	 */
	payments: Payment[];
};

/**
 * [ISO-4217](https://en.wikipedia.org/wiki/ISO_4217)
 *
 * @see Table 8
 * @see Table 15 field #5
 */
export const CurrencyCode = {
	AED: "AED",
	AFN: "AFN",
	ALL: "ALL",
	AMD: "AMD",
	ANG: "ANG",
	AOA: "AOA",
	ARS: "ARS",
	AUD: "AUD",
	AWG: "AWG",
	AZN: "AZN",
	BAM: "BAM",
	BBD: "BBD",
	BDT: "BDT",
	BGN: "BGN",
	BHD: "BHD",
	BIF: "BIF",
	BMD: "BMD",
	BND: "BND",
	BOB: "BOB",
	BRL: "BRL",
	BSD: "BSD",
	BTN: "BTN",
	BWP: "BWP",
	BYN: "BYN",
	BZD: "BZD",
	CAD: "CAD",
	CDF: "CDF",
	CHF: "CHF",
	CLP: "CLP",
	CNY: "CNY",
	COP: "COP",
	CRC: "CRC",
	CUC: "CUC",
	CUP: "CUP",
	CVE: "CVE",
	CZK: "CZK",
	DJF: "DJF",
	DKK: "DKK",
	DOP: "DOP",
	DZD: "DZD",
	EGP: "EGP",
	ERN: "ERN",
	ETB: "ETB",
	EUR: "EUR",
	FJD: "FJD",
	FKP: "FKP",
	GBP: "GBP",
	GEL: "GEL",
	GHS: "GHS",
	GIP: "GIP",
	GMD: "GMD",
	GNF: "GNF",
	GTQ: "GTQ",
	GYD: "GYD",
	HKD: "HKD",
	HNL: "HNL",
	HRK: "HRK",
	HTG: "HTG",
	HUF: "HUF",
	IDR: "IDR",
	ILS: "ILS",
	INR: "INR",
	IQD: "IQD",
	IRR: "IRR",
	ISK: "ISK",
	JMD: "JMD",
	JOD: "JOD",
	JPY: "JPY",
	KES: "KES",
	KGS: "KGS",
	KHR: "KHR",
	KMF: "KMF",
	KPW: "KPW",
	KRW: "KRW",
	KWD: "KWD",
	KYD: "KYD",
	KZT: "KZT",
	LAK: "LAK",
	LBP: "LBP",
	LKR: "LKR",
	LRD: "LRD",
	LSL: "LSL",
	LYD: "LYD",
	MAD: "MAD",
	MDL: "MDL",
	MGA: "MGA",
	MKD: "MKD",
	MMK: "MMK",
	MNT: "MNT",
	MOP: "MOP",
	MRU: "MRU",
	MUR: "MUR",
	MVR: "MVR",
	MWK: "MWK",
	MXN: "MXN",
	MYR: "MYR",
	MZN: "MZN",
	NAD: "NAD",
	NGN: "NGN",
	NIO: "NIO",
	NOK: "NOK",
	NPR: "NPR",
	NZD: "NZD",
	OMR: "OMR",
	PAB: "PAB",
	PEN: "PEN",
	PGK: "PGK",
	PHP: "PHP",
	PKR: "PKR",
	PLN: "PLN",
	PYG: "PYG",
	QAR: "QAR",
	RON: "RON",
	RSD: "RSD",
	RUB: "RUB",
	RWF: "RWF",
	SAR: "SAR",
	SBD: "SBD",
	SCR: "SCR",
	SDG: "SDG",
	SEK: "SEK",
	SGD: "SGD",
	SHP: "SHP",
	SLL: "SLL",
	SOS: "SOS",
	SRD: "SRD",
	SSP: "SSP",
	STN: "STN",
	SVC: "SVC",
	SYP: "SYP",
	SZL: "SZL",
	THB: "THB",
	TJS: "TJS",
	TMT: "TMT",
	TND: "TND",
	TOP: "TOP",
	TRY: "TRY",
	TTD: "TTD",
	TWD: "TWD",
	TZS: "TZS",
	UAH: "UAH",
	UGX: "UGX",
	USD: "USD",
	UYU: "UYU",
	UZS: "UZS",
	VES: "VES",
	VND: "VND",
	VUV: "VUV",
	WST: "WST",
	XAF: "XAF",
	XCD: "XCD",
	XOF: "XOF",
	XPF: "XPF",
	YER: "YER",
	ZAR: "ZAR",
	ZMW: "ZMW",
	ZWL: "ZWL",
} as const;

// Add type for enum-like usage
export type CurrencyCode = typeof CurrencyCode[keyof typeof CurrencyCode];

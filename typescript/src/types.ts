/**
 * Mapping semantic version to encoded version number, header 4-bit.
 * It's a bit silly to limit the version number to 4-bit, if they keep
 * increasing the version number, the latest possible mapped value is 16
 */
export const Version = {
	/**
	 * Created this document from original by square specifications.
	 *
	 * **Released Date:** 2013-02-22
	 */
	"1.0.0": 0x00,

	/**
	 * Added fields for beneficiary name and address
	 *
	 * **Released Date:** 2015-06-24
	 */
	"1.1.0": 0x01,

	/**
	 * Beneficiary name is now a required field
	 *
	 * **Released Date:** 2025-04-01
	 */
	"1.2.0": 0x02,
} as const;

// Add type for enum-like usage
export type Version = typeof Version[keyof typeof Version];

/**
 * Calendar month.
 *
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
 * (1=Monday,2=Tuesday, …, 7=Sunday).
 *
 * @description Payment day value range from 1 to 31
 * @minimum 1
 * @maximum 31
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
 * Payment options can be combined. At least one option must be specified:
 *
 * - `PaymentOrder`: Single payment order
 * - `StandingOrder`: Standing order (recurring payment), details in StandingOrderExt
 * - `DirectDebit`: Direct debit, details in DirectDebitExt
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
 */
export type BankAccount = {
	/**
	 * International Bank Account Number in IBAN format.
	 *
	 * @example "SK8209000000000011424060"
	 * @pattern [A-Z]{2}[0-9]{2}[A-Z0-9]{0,30}
	 * @minLength 15
	 * @maxLength 34
	 */
	iban: string;

	/**
	 * Bank Identification Code (BIC) in ISO 9362 format (SWIFT).
	 *
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
 * @maximum 1
 *
 * - one-off: One-time direct debit
 * - recurrent: Recurring direct debit
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
	 * Beneficiary name (required since v1.2.0).
	 *
	 * @maxLength 70
	 */
	name: string;

	/**
	 * Beneficiary street address.
	 *
	 * @maxLength 70
	 */
	street?: string;

	/**
	 * Beneficiary city.
	 *
	 * @maxLength 70
	 */
	city?: string;
};

export type SimplePayment = {
	/**
	 * Payment amount. Only positive values are allowed. The decimal part is
	 * separated by a dot. Can be left empty, e.g., for voluntary donations.
	 *
	 * @example 1000
	 * @example 1.99
	 * @example 10.5
	 * @example 0.08
	 * @minimum 0
	 * @maximum 999999999999999
	 */
	amount?: number;

	/**
	 * Currency code in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) format (3 letters).
	 *
	 * @example "EUR"
	 * @pattern [A-Z]{3}
	 * @minLength 3
	 * @maxLength 3
	 */
	currencyCode: string | keyof typeof CurrencyCode;

	/**
	 * Payment due date.
	 *
	 * For standing orders, this indicates the first payment date.
	 * The date will be converted to YYYYMMDD format during encoding per specification section 3.7.
	 *
	 * @format date
	 * @example "2024-12-31"
	 * @pattern \d{4}-\d{2}-\d{2}
	 */
	paymentDueDate?: string;

	/**
	 * Variable symbol, up to 10 digits.
	 *
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	variableSymbol?: string;

	/**
	 * Constant symbol, a 4-digit payment identifier defined by NBS (National Bank of Slovakia).
	 *
	 * @pattern [0-9]{0,4}
	 * @maxLength 4
	 */
	constantSymbol?: string;

	/**
	 * Specific symbol, up to 10 digits.
	 *
	 * @pattern [0-9]{0,10}
	 * @maxLength 10
	 */
	specificSymbol?: string;

	/**
	 * Originator's reference information according to SEPA.
	 *
	 * @maxLength 35
	 */
	originatorsReferenceInformation?: string;

	/**
	 * Payment note for the recipient. Contains payment details that help the
	 * recipient identify the payment.
	 *
	 * @maxLength 140
	 */
	paymentNote?: string;

	/**
	 * List of bank accounts.
	 *
	 * @minItems 1
	 */
	bankAccounts: BankAccount[];

	/**
	 * Beneficiary information (required since v1.2.0).
	 */
	beneficiary: Beneficiary;
};

export type PaymentOrder = SimplePayment & {
	type: typeof PaymentOptions.PaymentOrder;
};

/**
 * Extension of payment data with standing order (recurring payment) settings.
 */
export type StandingOrder = SimplePayment & {
	type: typeof PaymentOptions.StandingOrder;
	/**
	 * Specifies the day on which the standing order will be processed in the
	 * specified months.
	 *
	 * @minimum 1
	 * @maximum 31
	 */
	day?: number | Day;

	/**
	 * Specifies the months in which the standing order payment should be
	 * executed.
	 *
	 * @example Month.January
	 * @example Month.January | Month.July | Month.October
	 * @example 577
	 */
	month?: keyof typeof Month | number;

	/**
	 * Periodicity (frequency) of the standing order.
	 */
	periodicity: keyof typeof Periodicity | string;

	/**
	 * Last payment date within the standing order.
	 *
	 * @format date
	 * @pattern \d{8}
	 * @example "20241231"
	 */
	lastDate?: string;
};

/**
 * Extension of payment data with direct debit settings and identification.
 */
export type DirectDebit = SimplePayment & {
	type: typeof PaymentOptions.DirectDebit;

	/**
	 * Direct debit scheme.
	 *
	 * @example DirectDebitScheme.Sepa
	 */
	directDebitScheme?: keyof typeof DirectDebitScheme | number;

	/**
	 * Direct debit type.
	 *
	 * @example DirectDebitType.Recurrent
	 */
	directDebitType?: keyof typeof DirectDebitType | number;

	/**
	 * Mandate identification between creditor and debtor according to SEPA.
	 *
	 * @maxLength 35
	 */
	mandateId?: string;

	/**
	 * Creditor identification according to SEPA.
	 *
	 * @maxLength 35
	 */
	creditorId?: string;

	/**
	 * Contract identification between creditor and debtor according to SEPA.
	 *
	 * @maxLength 35
	 */
	contractId?: string;

	/**
	 * Maximum direct debit amount.
	 *
	 * @minimum 0
	 * @maximum 999999999999999
	 */
	maxAmount?: number;

	/**
	 * Direct debit validity date. The direct debit expires on this date.
	 *
	 * @format date
	 * @pattern \d{8}
	 * @maxLength 8
	 * @example "20241231"
	 */
	validTillDate?: string;
};

/**
 * Data for a single payment order.
 */
export type Payment = PaymentOrder | StandingOrder | DirectDebit;

export type DataModel = {
	/**
	 * Invoice number if the data is part of an invoice, or an identifier for
	 * the issuer's internal purposes.
	 *
	 * @maxLength 10
	 */
	invoiceId?: string;

	/**
	 * List of one or more payments for batch payment orders.
	 * The main (preferred) payment should be listed first.
	 *
	 * @minItems 1
	 */
	payments: Payment[];
};

/**
 * [ISO-4217](https://en.wikipedia.org/wiki/ISO_4217)
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

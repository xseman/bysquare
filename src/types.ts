/**
 * Mapping semantic version to encoded version number, header 4-bits
 *
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
} as const;

// Add type for enum-like usage
export type Version = typeof Version[keyof typeof Version];

/**
 * Kalendárny mesiac.
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
 * Deň platby vyplývajúci z opakovania (Periodicity). Deň v mesiaci je číslo
 * medzi 1 a 31. Deň v týždni je číslo medzi 1 a 7 (1 = pondelok, 2=utorok, …, 7
 * = nedeľa).
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
 * This is the payment day. It‘s meaning depends on the periodicity, meaning
 * either day of the month (number between 1 and 31) or day of the week
 * (1=Monday,2=Tuesday, …, 7=Sunday).
 *
 * @maximum 2
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
 * Možnosti platby sa dajú kombinovať. Oddeľujú sa medzerou a treba uviesť vždy
 * aspoň jednu z možností:
 *
 * - `PaymentOrder`: platobný príkaz
 * - `StandingOrder`: trvalý príkaz, údaje sa vyplnia do StandingOrderExt
 * - `DirectDebit`: inkaso, údaje sa vyplnia do DirectDebitExt
 */
export const PaymentOptions = {
	/**
	 * Platobný príkaz
	 */
	PaymentOrder: 0b00000001,
	/**
	 * Trvalý príkaz, údaje sa vyplnia do StandingOrderExt
	 */
	StandingOrder: 0b00000010,
	/**
	 * Inkaso, údaje sa vyplnia do DirectDebitExt
	 */
	DirectDebit: 0b00000100,
} as const;

// Add type for enum-like usage
export type PaymentOptions = typeof PaymentOptions[keyof typeof PaymentOptions];

/**
 * Údaje bankového účtu prijímateľa platby.
 */
export type BankAccount = {
	/**
	 * Medzinárodné číslo bankového účtu vo formáte IBAN. Príklad:
	 *
	 * @example `"SK8209000000000011424060"`
	 * @maximum 34
	 * @pattern [A-Z]{2}[0-9]{2}[A-Z0-9]{0,30}
	 */
	iban: string;

	/**
	 * Medzinárodný bankový identifikačný kód (z ang. Bank Identification Code).
	 *
	 * Formát [ISO 9362](https://en.wikipedia.org/wiki/ISO_9362) (swift) 8 or 11 characters long
	 *
	 * @example "TATRSKBX"
	 * @pattern [A-Z]{4}[A-Z]{2}[A-Z\d]{2}([A-Z\d]{3})?
	 */
	bic?: string;
};

/**
 * Inksaná schéma. Uvádza ja jedna z možností:
 *
 * - SEPA - Inkaso zodpovedá schéme
 * - SEPA. other - iné
 */
export const DirectDebitScheme = {
	/**
	 * other - iné
	 */
	Other: 0x00,
	/**
	 * SEPA - Inkaso zodpovedá schéme
	 */
	Sepa: 0x01,
} as const;

// Add type for enum-like usage
export type DirectDebitScheme = typeof DirectDebitScheme[keyof typeof DirectDebitScheme];

/**
 * Typ inkasa. Uvádza ja jedna z možností:
 *
 * @maximum 1
 *
 * - one-off - jednorázové inkaso
 * - recurrent - opakované inkaso
 */
export const DirectDebitType = {
	/**
	 * Jednorázové inkaso
	 */
	OneOff: 0x00,
	/**
	 * Opakované inkaso
	 */
	Recurrent: 0x01,
} as const;

// Add type for enum-like usage
export type DirectDebitType = typeof DirectDebitType[keyof typeof DirectDebitType];

export type Beneficiary = {
	/**
	 * Rozšírenie o meno príjemcu
	 *
	 * @maximum 70
	 */
	name?: string;
	/**
	 * Rozšírenie o adresu príjemcu
	 *
	 * @maximum 70
	 */
	street?: string;
	/**
	 * Rozšírenie o adresu príjemcu (druhý riadok)
	 *
	 * @maximum 70
	 */
	city?: string;
};

export type SimplePayment = {
	/**
	 * Čiastka platby. Povolené sú len kladné hodnoty. Desatinná čast je
	 * oddelená bodkou. Môže ostať nevyplnené, napríklad pre dobrovoľný
	 * príspevok (donations).
	 *
	 * Príklad: Tisíc sa uvádza ako `1000`. Jedna celá
	 * deväťdesiatdeväť sa uvádza ako `1.99`. Desať celých peťdesiat sa uvádza
	 * ako `10.5`. Nula celá nula osem sa uvádza ako `0.08`.
	 *
	 * @maximum 15
	 */
	amount?: number;
	/**
	 * Mena v [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) formáte (3 písmená).
	 *
	 * @example "EUR"
	 * @pattern [A-Z]{3}
	 */
	currencyCode: string | keyof typeof CurrencyCode;
	/**
	 * Dátum splatnosti vo formáte [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) `"RRRR-MM-DD"`.
	 * Vprípade trvalého príkazu označuje dátum prvej platby.
	 *
	 * Formát `YYYY-MM-DD`
	 */
	paymentDueDate?: string;
	/**
	 * Variabilný symbol je maximálne 10 miestne číslo.
	 *
	 * @maximum 10
	 * @pattern [0-9]{0,10}
	 */
	variableSymbol?: string;
	/**
	 * Konštantný symbol je 4 miestne identifikačné číslo.
	 *
	 * @maximum 4
	 * @pattern [0-9]{0,4}
	 */
	constantSymbol?: string;
	/**
	 * Špecifický symbol je maximálne 10 miestne číslo.
	 *
	 * @maximum 10
	 * @pattern [0-9]{0,10}
	 */
	specificSymbol?: string;
	/**
	 * Referenčná informácia prijímateľa podľa SEPA.
	 *
	 * @maximum 35
	 */
	originatorsReferenceInformation?: string;
	/**
	 * Správa pre prijímateľa. Údaje o platbe, na základe ktorých príjemca bude
	 * môcť platbu identifikovať.
	 *
	 * @maximum 140
	 */
	paymentNote?: string;
	/**
	 * Zoznam bankových účtov.
	 */
	bankAccounts: BankAccount[];
	beneficiary?: Beneficiary;
};

export type PaymentOrder = SimplePayment & {
	type: typeof PaymentOptions.PaymentOrder;
};

/**
 * Rozšírenie platobných údajov o údaje pre nastavenie trvalého príkazu.
 */
export type StandingOrder = SimplePayment & {
	type: typeof PaymentOptions.StandingOrder;
	/**
	 * Deň platby vyplývajúci z opakovania (Periodicity). Deň v mesiaci je číslo
	 * medzi 1 a 31. Deň v týždni je číslo medzi 1 a 7 (1 = pondelok, 2 =utorok,
	 * …, 7 = nedeľa).
	 */
	day?: number | Day;
	/**
	 * Medzerou oddelený zoznam mesiacov, v ktoré sa má platba uskutočniť.
	 */
	month?: keyof typeof Month | number;
	/**
	 * Opakovanie (periodicita) trvalého príkazu.
	 */
	periodicity: keyof typeof Periodicity | string;
	/**
	 * Dátum poslednej platby v trvalom príkaze.
	 *
	 * Formát `YYYYMMDD`
	 */
	lastDate?: string;
};

/**
 * Rozšírenie platobných údajov o údaje pre nastavenie a identifikáciu inkasa.
 */
export type DirectDebit = SimplePayment & {
	type: typeof PaymentOptions.DirectDebit;
	directDebitScheme?: keyof typeof DirectDebitScheme | number;
	directDebitType?: keyof typeof DirectDebitType | number;
	/**
	 * Identifikácia mandátu medzi veriteľom a dlžníkom podľa SEPA.
	 *
	 * @maximum 35
	 */
	mandateId?: string;
	/**
	 * Identifikácia veriteľa podľa SEPA.
	 *
	 * @maximum 35
	 */
	creditorId?: string;
	/**
	 * Identifikácia zmluvy medzi veriteľom a dlžníkom podľa SEPA.
	 *
	 * @maximum 35
	 */
	contractId?: string;
	/**
	 * Maximálna čiastka inkasa.
	 *
	 * @maximum 15
	 */
	maxAmount?: number;
	/**
	 * Dátum platnosti inkasa. Platnosť inkasa zaníka dňom tohto dátumu.
	 *
	 * @maximum 8
	 * Formát `YYYYMMDD`
	 */
	validTillDate?: string;
};

/**
 * Údaje pre jeden platobný príkaz.
 */
export type Payment = PaymentOrder | StandingOrder | DirectDebit;

export type DataModel = {
	/**
	 * Číslo faktúry v prípade, že údaje sú súčasťou faktúry, alebo
	 * identifikátor pre intérne potreby vystavovateľa.
	 *
	 * @maximum 10
	 */
	invoiceId?: string;
	/**
	 * Zoznam jednej alebo viacerých platieb v prípade hromadného príkazu.
	 * Hlavná (preferovaná) platba sa uvádza ako prvá.
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

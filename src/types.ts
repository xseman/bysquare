/**
 * Mapping semantic version to encoded version number, header 4-bits
 *
 * It's a bit silly to limit the version number to 4-bit, if they keep
 * increasing the version number, the latest possible mapped value is 16
 */
export enum Version {
	/**
	 * Created this document from original by square specifications.
	 *
	 * **Released Date:** 2013-02-22
	 */
	"1.0.0" = 0x00,
	/**
	 * Added fields for beneficiary name and address
	 *
	 * **Released Date:** 2015-06-24
	 */
	"1.1.0" = 0x01,
}

/**
 * Kalendárny mesiac.
 */
export enum MonthFlag {
	January = 1 << 0,
	February = 1 << 1,
	March = 1 << 2,
	April = 1 << 3,
	May = 1 << 4,
	June = 1 << 5,
	July = 1 << 6,
	August = 1 << 7,
	September = 1 << 8,
	October = 1 << 9,
	November = 1 << 10,
	December = 1 << 11,
}

/**
 * Deň platby vyplývajúci z opakovania (Periodicity). Deň v mesiaci je číslo
 * medzi 1 a 31. Deň v týždni je číslo medzi 1 a 7 (1 = pondelok, 2=utorok, …, 7
 * = nedeľa).
 */
export enum Periodicity {
	Daily = "d",
	Weekly = "w",
	Biweekly = "b",
	Monthly = "m",
	Bimonthly = "B",
	Quarterly = "q",
	Semiannually = "s",
	Annually = "a",
}

/**
 * This is the payment day. It‘s meaning depends on the periodicity, meaning
 * either day of the month (number between 1 and 31) or day of the week
 * (1=Monday,2=Tuesday, …, 7=Sunday).
 *
 * Maximálna dĺžka 2
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
export enum PaymentOptions {
	/**
	 * Platobný príkaz
	 */
	PaymentOrder = 1 << 0,
	/**
	 * Trvalý príkaz, údaje sa vyplnia do StandingOrderExt
	 */
	StandingOrder = 1 << 1,
	/**
	 * Inkaso, údaje sa vyplnia do DirectDebitExt
	 */
	DirectDebit = 1 << 2,
}

/**
 * Údaje bankového účtu prijímateľa platby.
 */
export type BankAccount = {
	/**
	 * Medzinárodné číslo bankového účtu vo formáte IBAN. Príklad:
	 *
	 * Maximálna dĺžka 34
	 *
	 * Pattern: `[A-Z]{2}[0-9]{2}[A-Z0-9]{0,30}`
	 *
	 * @example `"SK8209000000000011424060"`
	 */
	iban: string;

	/**
	 * Medzinárodný bankový identifikačný kód (z ang. Bank Identification Code).
	 *
	 * Formát [ISO 9362](https://en.wikipedia.org/wiki/ISO_9362) (swift) 8 or 11 characters long
	 *
	 * Pattern: `[A-Z]{4}[A-Z]{2}[A-Z\d]{2}([A-Z\d]{3})?`
	 *
	 * @example "TATRSKBX"
	 */
	bic?: string;
};

/**
 * Inksaná schéma. Uvádza ja jedna z možností:
 *
 * - SEPA - Inkaso zodpovedá schéme
 * - SEPA. other - iné
 */
export enum DirectDebitScheme {
	/**
	 * other - iné
	 */
	Other = 0,
	/**
	 * SEPA - Inkaso zodpovedá schéme
	 */
	Sepa = 1,
}

/**
 * Typ inkasa. Uvádza ja jedna z možností:
 *
 * Maximálna dĺžka 1
 *
 * - one-off - jednorázové inkaso
 * - recurrent - opakované inkaso
 */
export enum DirectDebitType {
	/**
	 * Jednorázové inkaso
	 */
	OneOff = 0,
	/**
	 * Opakované inkaso
	 */
	Recurrent = 1,
}

export type Beneficiary = {
	/**
	 * Rozšírenie o meno príjemcu
	 *
	 * Maximálna dĺžka 70
	 */
	name?: string;
	/**
	 * Rozšírenie o adresu príjemcu
	 *
	 * Maximálna dĺžka 70
	 */
	street?: string;
	/**
	 * Rozšírenie o adresu príjemcu (druhý riadok)
	 *
	 * Maximálna dĺžka 70
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
	 * Maximálna dĺžka 15
	 */
	amount?: number;
	/**
	 * Mena v [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) formáte (3 písmená).
	 *
	 * Pattern: [A-Z]{3}
	 *
	 * @example "EUR"
	 */
	currencyCode: string | CurrencyCode;
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
	 * Maximálna dĺžka 10
	 * Pattern: [0-9]{0,10}
	 */
	variableSymbol?: string;
	/**
	 * Konštantný symbol je 4 miestne identifikačné číslo.
	 *
	 * Maximálna dĺžka 4
	 * Pattern: [0-9]{0,4}
	 */
	constantSymbol?: string;
	/**
	 * Špecifický symbol je maximálne 10 miestne číslo.
	 *
	 * Maximálna dĺžka 10
	 * Pattern: [0-9]{0,10}
	 */
	specificSymbol?: string;
	/**
	 * Referenčná informácia prijímateľa podľa SEPA.
	 *
	 * Maximálna dĺžka 35
	 */
	originatorsReferenceInformation?: string;
	/**
	 * Správa pre prijímateľa. Údaje o platbe, na základe ktorých príjemca bude
	 * môcť platbu identifikovať.
	 *
	 * Maximálna dĺžka 140
	 */
	paymentNote?: string;
	/**
	 * Zoznam bankových účtov.
	 */
	bankAccounts: BankAccount[];
	beneficiary?: Beneficiary;
};

export type PaymentOrder = SimplePayment & {
	type: PaymentOptions.PaymentOrder;
};

/**
 * Rozšírenie platobných údajov o údaje pre nastavenie trvalého príkazu.
 */
export type StandingOrder = SimplePayment & {
	type: PaymentOptions.StandingOrder;
	/**
	 * Deň platby vyplývajúci z opakovania (Periodicity). Deň v mesiaci je číslo
	 * medzi 1 a 31. Deň v týždni je číslo medzi 1 a 7 (1 = pondelok, 2 =utorok,
	 * …, 7 = nedeľa).
	 */
	day?: number | Day;
	/**
	 * Medzerou oddelený zoznam mesiacov, v ktoré sa má platba uskutočniť.
	 */
	month?: MonthFlag;
	/**
	 * Opakovanie (periodicita) trvalého príkazu.
	 */
	periodicity?: Periodicity;
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
	type: PaymentOptions.DirectDebit;
	directDebitScheme?: DirectDebitScheme;
	directDebitType?: DirectDebitType;
	/**
	 * Identifikácia mandátu medzi veriteľom a dlžníkom podľa SEPA.
	 *
	 * Maximálna dĺžka 35
	 */
	mandateId?: string;
	/**
	 * Identifikácia veriteľa podľa SEPA.
	 *
	 * Maximálna dĺžka 35
	 */
	creditorId?: string;
	/**
	 * Identifikácia zmluvy medzi veriteľom a dlžníkom podľa SEPA.
	 *
	 * Maximálna dĺžka 35
	 */
	contractId?: string;
	/**
	 * Maximálna čiastka inkasa.
	 *
	 * Maximálna dĺžka 15
	 */
	maxAmount?: number;
	/**
	 * Dátum platnosti inkasa. Platnosť inkasa zaníka dňom tohto dátumu.
	 *
	 * Maximálna dĺžka 8
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
	 * Maximálna dĺžka 10
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
export enum CurrencyCode {
	AED = "AED",
	AFN = "AFN",
	ALL = "ALL",
	AMD = "AMD",
	ANG = "ANG",
	AOA = "AOA",
	ARS = "ARS",
	AUD = "AUD",
	AWG = "AWG",
	AZN = "AZN",
	BAM = "BAM",
	BBD = "BBD",
	BDT = "BDT",
	BGN = "BGN",
	BHD = "BHD",
	BIF = "BIF",
	BMD = "BMD",
	BND = "BND",
	BOB = "BOB",
	BRL = "BRL",
	BSD = "BSD",
	BTN = "BTN",
	BWP = "BWP",
	BYN = "BYN",
	BZD = "BZD",
	CAD = "CAD",
	CDF = "CDF",
	CHF = "CHF",
	CLP = "CLP",
	CNY = "CNY",
	COP = "COP",
	CRC = "CRC",
	CUC = "CUC",
	CUP = "CUP",
	CVE = "CVE",
	CZK = "CZK",
	DJF = "DJF",
	DKK = "DKK",
	DOP = "DOP",
	DZD = "DZD",
	EGP = "EGP",
	ERN = "ERN",
	ETB = "ETB",
	EUR = "EUR",
	FJD = "FJD",
	FKP = "FKP",
	GBP = "GBP",
	GEL = "GEL",
	GHS = "GHS",
	GIP = "GIP",
	GMD = "GMD",
	GNF = "GNF",
	GTQ = "GTQ",
	GYD = "GYD",
	HKD = "HKD",
	HNL = "HNL",
	HRK = "HRK",
	HTG = "HTG",
	HUF = "HUF",
	IDR = "IDR",
	ILS = "ILS",
	INR = "INR",
	IQD = "IQD",
	IRR = "IRR",
	ISK = "ISK",
	JMD = "JMD",
	JOD = "JOD",
	JPY = "JPY",
	KES = "KES",
	KGS = "KGS",
	KHR = "KHR",
	KMF = "KMF",
	KPW = "KPW",
	KRW = "KRW",
	KWD = "KWD",
	KYD = "KYD",
	KZT = "KZT",
	LAK = "LAK",
	LBP = "LBP",
	LKR = "LKR",
	LRD = "LRD",
	LSL = "LSL",
	LYD = "LYD",
	MAD = "MAD",
	MDL = "MDL",
	MGA = "MGA",
	MKD = "MKD",
	MMK = "MMK",
	MNT = "MNT",
	MOP = "MOP",
	MRU = "MRU",
	MUR = "MUR",
	MVR = "MVR",
	MWK = "MWK",
	MXN = "MXN",
	MYR = "MYR",
	MZN = "MZN",
	NAD = "NAD",
	NGN = "NGN",
	NIO = "NIO",
	NOK = "NOK",
	NPR = "NPR",
	NZD = "NZD",
	OMR = "OMR",
	PAB = "PAB",
	PEN = "PEN",
	PGK = "PGK",
	PHP = "PHP",
	PKR = "PKR",
	PLN = "PLN",
	PYG = "PYG",
	QAR = "QAR",
	RON = "RON",
	RSD = "RSD",
	RUB = "RUB",
	RWF = "RWF",
	SAR = "SAR",
	SBD = "SBD",
	SCR = "SCR",
	SDG = "SDG",
	SEK = "SEK",
	SGD = "SGD",
	SHP = "SHP",
	SLL = "SLL",
	SOS = "SOS",
	SRD = "SRD",
	SSP = "SSP",
	STN = "STN",
	SVC = "SVC",
	SYP = "SYP",
	SZL = "SZL",
	THB = "THB",
	TJS = "TJS",
	TMT = "TMT",
	TND = "TND",
	TOP = "TOP",
	TRY = "TRY",
	TTD = "TTD",
	TWD = "TWD",
	TZS = "TZS",
	UAH = "UAH",
	UGX = "UGX",
	USD = "USD",
	UYU = "UYU",
	UZS = "UZS",
	VES = "VES",
	VND = "VND",
	VUV = "VUV",
	WST = "WST",
	XAF = "XAF",
	XCD = "XCD",
	XOF = "XOF",
	XPF = "XPF",
	YER = "YER",
	ZAR = "ZAR",
	ZMW = "ZMW",
	ZWL = "ZWL",
}

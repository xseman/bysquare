/**
 * Mapping semantic version to encoded version number, header 4-bits
 *
 * It's a bit silly to limit the version number to 4-bit, if they keep
 * increasing the version number, the latest possible mapped value is 16
 */
export const enum Version {
	/**
	 * 2013-02-22
	 * Created this document from original by square specifications
	 */
	"1.0.0" = 0x00,
	/**
	 * 2015-06-24
	 * Added fields for beneficiary name and address
	 */
	"1.1.0" = 0x01
}

/**
 * Kalendárny mesiac.
 */
export enum MonthClassifier {
	January = 1,
	February = 2,
	March = 4,
	April = 8,
	May = 16,
	June = 32,
	July = 64,
	August = 128,
	September = 256,
	October = 512,
	November = 1_024,
	December = 2_048
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
	Annually = "a"
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
 * - paymentorder: platobný príkaz
 * - standingorder: trvalý príkaz, údaje sa vyplnia do StandingOrderExt
 * - directdebit: inkaso, údaje sa vyplnia do DirectDebitExt
 */
export enum PaymentOptions {
	PaymentOrder = 1,
	StandingOrder = 2,
	DirectDebit = 4
}

/**
 * Údaje bankového účtu prijímateľa platby.
 */
export type BankAccount = {
	/**
	 * Maximálna dĺžka 34
	 * Pattern: [A-Z]{2}[0-9]{2}[A-Z0-9]{0,30}
	 *
	 * Medzinárodné číslo bankového účtu vo formáte IBAN. Príklad:
	 * "SK8209000000000011424060". Viac na
	 * http://www.sbaonline.sk/sk/projekty/financne-vzdelavanie/slovnik-bankovych-pojmov/iii/.
	 */
	iban: string;

	/**
	 * Formát ISO 9362 (swift) 8 or 11 characters long
	 * Pattern: [A-Z]{4}[A-Z]{2}[A-Z\d]{2}([A-Z\d]{3})?
	 *
	 * Medzinárodný bankový identifikačný kód (z ang. Bank Identification Code).
	 * Viac na http://www.sbaonline.sk/sk/projekty/financne-vzdelavanie/slovnik-bankovych-pojmov/bbb/bic
	 */
	bic?: string;
};

/**
 * Inksaná schéma. Uvádza ja jedna z možností:
 *
 * SEPA - Inkaso zodpovedá schéme
 * SEPA. other - iné
 */
export enum DirectDebitScheme {
	Other = 0,
	Sepa = 1
}

/**
 * Maximálna dĺžka 1
 *
 * Typ inkasa. Uvádza ja jedna z možností:
 *
 * one-off - jednorázové inkaso
 * recurrent - opakované inkaso
 */
export enum DirectDebitType {
	OneOff = 0,
	Recurrent = 1
}

export type Beneficiary = {
	/**
	 * Maximálna dĺžka 70
	 *
	 * Rozšírenie o meno príjemcu
	 */
	name?: string;
	/**
	 * Maximálna dĺžka 70
	 *
	 * Rozšírenie o adresu príjemcu
	 */
	street?: string;
	/**
	 * Maximálna dĺžka 70
	 *
	 * Rozšírenie o adresu príjemcu (druhý riadok)
	 */
	city?: string;
};

export type SimplePayment = {
	/**
	 * Maximálna dĺžka 15
	 *
	 * Čiastka platby. Povolené sú len kladné hodnoty. Desatinná čast je
	 * oddelená bodkou. Môže ostať nevyplnené, napríklad pre dobrovoľný
	 * príspevok (donations). Príklad: Tisíc sa uvádza ako "1000". Jedna celá
	 * deväťdesiatdeväť sa uvádza ako "1.99". Desať celých peťdesiat sa uvádza
	 * ako "10.5". Nula celá nula osem sa uvádza ako "0.08".
	 */
	amount?: number;
	/**
	 * Pattern: [A-Z]{3}
	 *
	 * Mena v ISO 4217 formáte (3 písmená). Príklad: "EUR"
	 */
	currencyCode: CurrencyCode;
	/**
	 * Formát YYYYMMDD
	 *
	 * Dátum splatnosti vo formáte ISO 8601 "RRRR-MM-DD". Nepovinný údaj. V
	 * prípade trvalého príkazu označuje dátum prvej platby.
	 */
	paymentDueDate?: string;
	/**
	 * Maximálna dĺžka 10
	 * Pattern: [0-9]{0,10}
	 *
	 * Variabilný symbol je maximálne 10 miestne číslo. Nepovinný údaj.
	 */
	variableSymbol?: string;
	/**
	 * Maximálna dĺžka 4
	 * Pattern: [0-9]{0,4}
	 *
	 * Konštantný symbol je 4 miestne identifikačné číslo. Nepovinný údaj.
	 */
	constantSymbol?: string;
	/**
	 * Maximálna dĺžka 10
	 * Pattern: [0-9]{0,10}
	 *
	 * Špecifický symbol je maximálne 10 miestne číslo. Nepovinný údaj.
	 */
	specificSymbol?: string;
	/**
	 * Maximálna dĺžka 35
	 *
	 * Referenčná informácia prijímateľa podľa SEPA.
	 */
	originatorsReferenceInformation?: string;
	/**
	 * Maximálna dĺžka 140
	 *
	 * Správa pre prijímateľa. Údaje o platbe, na základe ktorých príjemca bude
	 * môcť platbu identifikovať. Odporúča sa maximálne 140 Unicode znakov.
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
	day?: Day;
	/**
	 * Medzerou oddelený zoznam mesiacov, v ktoré sa má platba uskutočniť.
	 */
	month?: MonthClassifier;
	/**
	 * Opakovanie (periodicita) trvalého príkazu.
	 */
	periodicity?: Periodicity;
	/**
	 * Dátum poslednej platby v trvalom príkaze.
	 *
	 * Formát YYYYMMDD
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
	 * Maximálna dĺžka 35
	 *
	 * Identifikácia mandátu medzi veriteľom a dlžníkom podľa SEPA.
	 */
	mandateId?: string;
	/**
	 * Maximálna dĺžka 35
	 *
	 * Identifikácia veriteľa podľa SEPA.
	 */
	creditorId?: string;
	/**
	 * Maximálna dĺžka 35
	 *
	 * Identifikácia zmluvy medzi veriteľom a dlžníkom podľa SEPA.
	 */
	contractId?: string;
	/**
	 * Maximálna dĺžka 15
	 *
	 * Maximálna čiastka inkasa.
	 */
	maxAmount?: number;
	/**
	 * Maximálna dĺžka 8
	 * Formát YYYYMMDD
	 *
	 * Dátum platnosti inkasa. Platnosť inkasa zaníka dňom tohto dátumu.
	 */
	validTillDate?: string;
};

/**
 * Údaje pre jeden platobný príkaz.
 */
export type Payment = PaymentOrder | StandingOrder | DirectDebit;

export type DataModel = {
	/**
	 * Maximálna dĺžka 10
	 *
	 * Číslo faktúry v prípade, že údaje sú súčasťou faktúry, alebo
	 * identifikátor pre intérne potreby vystavovateľa.
	 */
	invoiceId?: string;
	/**
	 * Zoznam jednej alebo viacerých platieb v prípade hromadného príkazu.
	 * Hlavná (preferovaná) platba sa uvádza ako prvá.
	 */
	payments: Payment[];
};

/**
 * ISO-4217
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
	ZWL = "ZWL"
}

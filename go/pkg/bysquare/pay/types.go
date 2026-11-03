// Package pay implements PAY by square encoding and decoding.
//
// This package handles bysquareType=0x00 (PAY by square) data according
// to the Slovak Banking Association specification. [Encode] turns a
// [DataModel] into the QR string and [Decode] reads it back.
package pay

import "github.com/xseman/bysquare/go/pkg/bysquare"

// Month is a calendar month as a bit flag; a standing order combines
// several with bitwise OR.
//
// @see Appendix A, Table 10
// @see 3.7.
type Month uint16

// The months.
const (
	MonthJanuary   Month = 0b00000000000001
	MonthFebruary  Month = 0b00000000000010
	MonthMarch     Month = 0b00000000000100
	MonthApril     Month = 0b00000000001000
	MonthMay       Month = 0b00000000010000
	MonthJune      Month = 0b00000000100000
	MonthJuly      Month = 0b00000001000000
	MonthAugust    Month = 0b00000010000000
	MonthSeptember Month = 0b00000100000000
	MonthOctober   Month = 0b00001000000000
	MonthNovember  Month = 0b00010000000000
	MonthDecember  Month = 0b00100000000000
)

// Periodicity is how often a standing order pays.
//
// @see Appendix A, Table 9
type Periodicity string

// The periodicities.
const (
	PeriodicityDaily        Periodicity = "d"
	PeriodicityWeekly       Periodicity = "w"
	PeriodicityBiweekly     Periodicity = "b"
	PeriodicityMonthly      Periodicity = "m"
	PeriodicityBimonthly    Periodicity = "B"
	PeriodicityQuarterly    Periodicity = "q"
	PeriodicitySemiannually Periodicity = "s"
	PeriodicityAnnually     Periodicity = "a"
)

// Day is the payment day. Its meaning depends on the periodicity: a day of
// the month (1 to 31) or a day of the week (1 = Monday to 7 = Sunday).
//
// @see Table 15 field #16
// @see 2.5.
type Day uint8

// PaymentOptions is the payment options classifier; the values combine by
// summing.
//
// @see Appendix A, Table 11
// @see Table 15 field #3
// @see 2.1.
type PaymentOptions uint8

// The payment options.
const (
	// PaymentOptionsPaymentOrder is a single payment order.
	PaymentOptionsPaymentOrder PaymentOptions = 0b00000001

	// PaymentOptionsStandingOrder is a recurring payment, its details in the
	// standing order fields of [Payment].
	PaymentOptionsStandingOrder PaymentOptions = 0b00000010

	// PaymentOptionsDirectDebit is a direct debit, its details in the direct
	// debit fields of [Payment].
	PaymentOptionsDirectDebit PaymentOptions = 0b00000100
)

// BankAccount is where the money goes.
//
// @see Table 15 fields #13-14
type BankAccount struct {
	// IBAN is the account number in IBAN format, 15 to 34 characters, as in
	// "SK8209000000000011424060".
	//
	// @see Table 15 field #13
	// @see Table 8
	IBAN string `json:"iban"`

	// BIC is the bank's ISO 9362 (SWIFT) code, 8 or 11 characters, as in
	// "TATRSKBX".
	//
	// @see Table 15 field #14
	// @see Table 8
	BIC string `json:"bic,omitempty"`
}

// DirectDebitScheme is the direct debit scheme.
//
// @see Appendix A, Table 13
type DirectDebitScheme uint8

// The direct debit schemes.
const (
	DirectDebitSchemeOther DirectDebitScheme = 0x00
	DirectDebitSchemeSepa  DirectDebitScheme = 0x01
)

// DirectDebitType is the direct debit type.
//
// @see Appendix A, Table 12
type DirectDebitType uint8

// The direct debit types.
const (
	DirectDebitTypeOneOff    DirectDebitType = 0x00
	DirectDebitTypeRecurrent DirectDebitType = 0x01
)

// Beneficiary is who receives the payment.
type Beneficiary struct {
	// Name is the beneficiary's name, up to 70 characters. Added in 1.1.0,
	// required since 1.2.0.
	//
	// @see Table 15 field #31
	Name string `json:"name"`

	// Street is the beneficiary's street address, up to 70 characters.
	//
	// @see Table 15 field #32
	Street string `json:"street,omitempty"`

	// City is the beneficiary's city, up to 70 characters.
	//
	// @see Table 15 field #33
	City string `json:"city,omitempty"`
}

// SimplePayment holds the fields every payment has.
type SimplePayment struct {
	// Amount is the payment amount, not negative, up to 15 characters
	// written out.
	//
	// @see Table 15 field #4
	// @see Table 8
	Amount float64 `json:"amount"`

	// CurrencyCode is the three-letter ISO 4217 code, as in "EUR".
	//
	// @see Table 15 field #5
	// @see Table 8
	CurrencyCode CurrencyCode `json:"currencyCode"`

	// PaymentDueDate is the due date as YYYYMMDD, as in "20241231". For a
	// standing order it is the first payment date.
	//
	// @see Table 15 field #6
	// @see 3.7.
	PaymentDueDate string `json:"paymentDueDate,omitempty"`

	// VariableSymbol is the variable symbol, up to 10 digits.
	//
	// @see Table 15 field #7
	VariableSymbol string `json:"variableSymbol,omitempty"`

	// ConstantSymbol is the constant symbol, a payment identifier of up to 4
	// digits defined by the National Bank of Slovakia.
	//
	// @see Table 15 field #8
	ConstantSymbol string `json:"constantSymbol,omitempty"`

	// SpecificSymbol is the specific symbol, up to 10 digits.
	//
	// @see Table 15 field #9
	SpecificSymbol string `json:"specificSymbol,omitempty"`

	// OriginatorsReferenceInformation is the SEPA originator's reference, up
	// to 35 characters.
	//
	// @see Table 15 field #10
	OriginatorsReferenceInformation string `json:"originatorsReferenceInformation,omitempty"`

	// PaymentNote is the note for the recipient that helps them identify the
	// payment, up to 140 characters.
	//
	// @see Table 15 field #11
	// @see Table 14
	PaymentNote string `json:"paymentNote,omitempty"`

	// BankAccounts are the recipient's accounts, at least one.
	//
	// @see Table 15 fields #12-14
	// @see 2.2.
	BankAccounts []BankAccount `json:"bankAccounts"`

	// Beneficiary is who receives the payment. Added in 1.1.0, its name
	// required since 1.2.0.
	//
	// @see Table 15 fields #31-33
	// @see Appendix E
	Beneficiary Beneficiary `json:"beneficiary"`
}

// Payment is one payment of any type: the [SimplePayment] fields, the
// standing order fields read when Type is [PaymentOptionsStandingOrder], and
// the direct debit fields read when Type is [PaymentOptionsDirectDebit]. The TypeScript
// implementation spells this as the union PaymentOrder | StandingOrder |
// DirectDebit; the JSON is the same.
type Payment struct {
	// Type is the kind of payment, one of the PaymentOptions values.
	//
	// @see Table 15 field #3
	Type PaymentOptions `json:"type"`

	SimplePayment

	// Standing order.

	// Day is the day the standing order pays in the chosen months.
	//
	// @see Table 15 field #16
	Day Day `json:"day,omitempty"`

	// Month is the months the standing order pays in, several combined with
	// bitwise OR, as in MonthJanuary | MonthJuly | MonthOctober.
	//
	// @see Table 15 field #17
	// @see Appendix A, Table 10
	Month Month `json:"month,omitempty"`

	// Periodicity is how often the standing order pays.
	//
	// @see Table 15 field #18
	// @see Appendix A, Table 9
	Periodicity Periodicity `json:"periodicity,omitempty"`

	// LastDate is the last payment date as YYYYMMDD; the standing order ends
	// after it.
	//
	// @see Table 15 field #19
	LastDate string `json:"lastDate,omitempty"`

	// Direct debit.

	// DirectDebitScheme is the direct debit scheme.
	//
	// @see Table 15 field #21
	// @see Appendix A, Table 13
	DirectDebitScheme DirectDebitScheme `json:"directDebitScheme,omitempty"`

	// DirectDebitType is the direct debit type.
	//
	// @see Table 15 field #22
	// @see Appendix A, Table 12
	DirectDebitType DirectDebitType `json:"directDebitType,omitempty"`

	// DdVariableSymbol is the direct debit's own variable symbol, up to 10
	// digits, separate from the payment's.
	//
	// @see Table 15 field #23
	DdVariableSymbol string `json:"ddVariableSymbol,omitempty"`

	// DdSpecificSymbol is the direct debit's own specific symbol, up to 10
	// digits, separate from the payment's.
	//
	// @see Table 15 field #24
	DdSpecificSymbol string `json:"ddSpecificSymbol,omitempty"`

	// DdOriginatorsReferenceInformation is the direct debit's own SEPA
	// originator's reference, up to 35 characters, separate from the
	// payment's.
	//
	// @see Table 15 field #25
	DdOriginatorsReferenceInformation string `json:"ddOriginatorsReferenceInformation,omitempty"`

	// MandateID is the SEPA mandate between creditor and debtor, up to 35
	// characters.
	//
	// @see Table 15 field #26
	MandateID string `json:"mandateId,omitempty"`

	// CreditorID is the SEPA creditor identifier, up to 35 characters.
	//
	// @see Table 15 field #27
	CreditorID string `json:"creditorId,omitempty"`

	// ContractID is the SEPA contract between creditor and debtor, up to 35
	// characters.
	//
	// @see Table 15 field #28
	ContractID string `json:"contractId,omitempty"`

	// MaxAmount is the largest amount the direct debit may take, not
	// negative, up to 15 characters written out.
	//
	// @see Table 15 field #29
	MaxAmount float64 `json:"maxAmount,omitempty"`

	// ValidTillDate is the date the direct debit expires, as YYYYMMDD.
	//
	// @see Table 15 field #30
	ValidTillDate string `json:"validTillDate,omitempty"`
}

// DataModel is the whole PAY by square document.
//
// @see 4.
// @see Table 15
type DataModel struct {
	// InvoiceID is the invoice number when the payment belongs to an
	// invoice, or an identifier for the issuer's own use, up to 10
	// characters.
	//
	// @see Table 15 field #1
	InvoiceID string `json:"invoiceId,omitempty"`

	// Payments are one or more payments, the preferred one first.
	//
	// @see Table 15 field #2
	Payments []Payment `json:"payments"`
}

// EncodeOptions steer [Encode]: Deburr strips diacritics from the free-text
// fields, Validate runs [ValidateDataModel] first, Version picks the header
// version.
//
// Without options, Encode deburrs, validates and writes
// [bysquare.Version120]. Options replace those defaults as a whole instead
// of merging with them, so set every field: the zero value turns deburring
// and validation off and writes [bysquare.Version100].
type EncodeOptions struct {
	Deburr   bool
	Validate bool
	Version  bysquare.Version
}

// CurrencyCode is an ISO 4217 currency code. Any code works; the constants
// list the ones the TypeScript implementation names.
type CurrencyCode string

// The ISO 4217 currency codes.
const (
	CurrencyAED CurrencyCode = "AED"
	CurrencyAFN CurrencyCode = "AFN"
	CurrencyALL CurrencyCode = "ALL"
	CurrencyAMD CurrencyCode = "AMD"
	CurrencyANG CurrencyCode = "ANG"
	CurrencyAOA CurrencyCode = "AOA"
	CurrencyARS CurrencyCode = "ARS"
	CurrencyAUD CurrencyCode = "AUD"
	CurrencyAWG CurrencyCode = "AWG"
	CurrencyAZN CurrencyCode = "AZN"
	CurrencyBAM CurrencyCode = "BAM"
	CurrencyBBD CurrencyCode = "BBD"
	CurrencyBDT CurrencyCode = "BDT"
	CurrencyBGN CurrencyCode = "BGN"
	CurrencyBHD CurrencyCode = "BHD"
	CurrencyBIF CurrencyCode = "BIF"
	CurrencyBMD CurrencyCode = "BMD"
	CurrencyBND CurrencyCode = "BND"
	CurrencyBOB CurrencyCode = "BOB"
	CurrencyBRL CurrencyCode = "BRL"
	CurrencyBSD CurrencyCode = "BSD"
	CurrencyBTN CurrencyCode = "BTN"
	CurrencyBWP CurrencyCode = "BWP"
	CurrencyBYN CurrencyCode = "BYN"
	CurrencyBZD CurrencyCode = "BZD"
	CurrencyCAD CurrencyCode = "CAD"
	CurrencyCDF CurrencyCode = "CDF"
	CurrencyCHF CurrencyCode = "CHF"
	CurrencyCLP CurrencyCode = "CLP"
	CurrencyCNY CurrencyCode = "CNY"
	CurrencyCOP CurrencyCode = "COP"
	CurrencyCRC CurrencyCode = "CRC"
	CurrencyCUC CurrencyCode = "CUC"
	CurrencyCUP CurrencyCode = "CUP"
	CurrencyCVE CurrencyCode = "CVE"
	CurrencyCZK CurrencyCode = "CZK"
	CurrencyDJF CurrencyCode = "DJF"
	CurrencyDKK CurrencyCode = "DKK"
	CurrencyDOP CurrencyCode = "DOP"
	CurrencyDZD CurrencyCode = "DZD"
	CurrencyEGP CurrencyCode = "EGP"
	CurrencyERN CurrencyCode = "ERN"
	CurrencyETB CurrencyCode = "ETB"
	CurrencyEUR CurrencyCode = "EUR"
	CurrencyFJD CurrencyCode = "FJD"
	CurrencyFKP CurrencyCode = "FKP"
	CurrencyGBP CurrencyCode = "GBP"
	CurrencyGEL CurrencyCode = "GEL"
	CurrencyGHS CurrencyCode = "GHS"
	CurrencyGIP CurrencyCode = "GIP"
	CurrencyGMD CurrencyCode = "GMD"
	CurrencyGNF CurrencyCode = "GNF"
	CurrencyGTQ CurrencyCode = "GTQ"
	CurrencyGYD CurrencyCode = "GYD"
	CurrencyHKD CurrencyCode = "HKD"
	CurrencyHNL CurrencyCode = "HNL"
	CurrencyHRK CurrencyCode = "HRK"
	CurrencyHTG CurrencyCode = "HTG"
	CurrencyHUF CurrencyCode = "HUF"
	CurrencyIDR CurrencyCode = "IDR"
	CurrencyILS CurrencyCode = "ILS"
	CurrencyINR CurrencyCode = "INR"
	CurrencyIQD CurrencyCode = "IQD"
	CurrencyIRR CurrencyCode = "IRR"
	CurrencyISK CurrencyCode = "ISK"
	CurrencyJMD CurrencyCode = "JMD"
	CurrencyJOD CurrencyCode = "JOD"
	CurrencyJPY CurrencyCode = "JPY"
	CurrencyKES CurrencyCode = "KES"
	CurrencyKGS CurrencyCode = "KGS"
	CurrencyKHR CurrencyCode = "KHR"
	CurrencyKMF CurrencyCode = "KMF"
	CurrencyKPW CurrencyCode = "KPW"
	CurrencyKRW CurrencyCode = "KRW"
	CurrencyKWD CurrencyCode = "KWD"
	CurrencyKYD CurrencyCode = "KYD"
	CurrencyKZT CurrencyCode = "KZT"
	CurrencyLAK CurrencyCode = "LAK"
	CurrencyLBP CurrencyCode = "LBP"
	CurrencyLKR CurrencyCode = "LKR"
	CurrencyLRD CurrencyCode = "LRD"
	CurrencyLSL CurrencyCode = "LSL"
	CurrencyLYD CurrencyCode = "LYD"
	CurrencyMAD CurrencyCode = "MAD"
	CurrencyMDL CurrencyCode = "MDL"
	CurrencyMGA CurrencyCode = "MGA"
	CurrencyMKD CurrencyCode = "MKD"
	CurrencyMMK CurrencyCode = "MMK"
	CurrencyMNT CurrencyCode = "MNT"
	CurrencyMOP CurrencyCode = "MOP"
	CurrencyMRU CurrencyCode = "MRU"
	CurrencyMUR CurrencyCode = "MUR"
	CurrencyMVR CurrencyCode = "MVR"
	CurrencyMWK CurrencyCode = "MWK"
	CurrencyMXN CurrencyCode = "MXN"
	CurrencyMYR CurrencyCode = "MYR"
	CurrencyMZN CurrencyCode = "MZN"
	CurrencyNAD CurrencyCode = "NAD"
	CurrencyNGN CurrencyCode = "NGN"
	CurrencyNIO CurrencyCode = "NIO"
	CurrencyNOK CurrencyCode = "NOK"
	CurrencyNPR CurrencyCode = "NPR"
	CurrencyNZD CurrencyCode = "NZD"
	CurrencyOMR CurrencyCode = "OMR"
	CurrencyPAB CurrencyCode = "PAB"
	CurrencyPEN CurrencyCode = "PEN"
	CurrencyPGK CurrencyCode = "PGK"
	CurrencyPHP CurrencyCode = "PHP"
	CurrencyPKR CurrencyCode = "PKR"
	CurrencyPLN CurrencyCode = "PLN"
	CurrencyPYG CurrencyCode = "PYG"
	CurrencyQAR CurrencyCode = "QAR"
	CurrencyRON CurrencyCode = "RON"
	CurrencyRSD CurrencyCode = "RSD"
	CurrencyRUB CurrencyCode = "RUB"
	CurrencyRWF CurrencyCode = "RWF"
	CurrencySAR CurrencyCode = "SAR"
	CurrencySBD CurrencyCode = "SBD"
	CurrencySCR CurrencyCode = "SCR"
	CurrencySDG CurrencyCode = "SDG"
	CurrencySEK CurrencyCode = "SEK"
	CurrencySGD CurrencyCode = "SGD"
	CurrencySHP CurrencyCode = "SHP"
	CurrencySLL CurrencyCode = "SLL"
	CurrencySOS CurrencyCode = "SOS"
	CurrencySRD CurrencyCode = "SRD"
	CurrencySSP CurrencyCode = "SSP"
	CurrencySTN CurrencyCode = "STN"
	CurrencySVC CurrencyCode = "SVC"
	CurrencySYP CurrencyCode = "SYP"
	CurrencySZL CurrencyCode = "SZL"
	CurrencyTHB CurrencyCode = "THB"
	CurrencyTJS CurrencyCode = "TJS"
	CurrencyTMT CurrencyCode = "TMT"
	CurrencyTND CurrencyCode = "TND"
	CurrencyTOP CurrencyCode = "TOP"
	CurrencyTRY CurrencyCode = "TRY"
	CurrencyTTD CurrencyCode = "TTD"
	CurrencyTWD CurrencyCode = "TWD"
	CurrencyTZS CurrencyCode = "TZS"
	CurrencyUAH CurrencyCode = "UAH"
	CurrencyUGX CurrencyCode = "UGX"
	CurrencyUSD CurrencyCode = "USD"
	CurrencyUYU CurrencyCode = "UYU"
	CurrencyUZS CurrencyCode = "UZS"
	CurrencyVES CurrencyCode = "VES"
	CurrencyVND CurrencyCode = "VND"
	CurrencyVUV CurrencyCode = "VUV"
	CurrencyWST CurrencyCode = "WST"
	CurrencyXAF CurrencyCode = "XAF"
	CurrencyXCD CurrencyCode = "XCD"
	CurrencyXOF CurrencyCode = "XOF"
	CurrencyXPF CurrencyCode = "XPF"
	CurrencyYER CurrencyCode = "YER"
	CurrencyZAR CurrencyCode = "ZAR"
	CurrencyZMW CurrencyCode = "ZMW"
	CurrencyZWL CurrencyCode = "ZWL"
)

// Package pay implements PAY by square encoding and decoding.
//
// This package handles bysquareType=0x00 (PAY by square) data according
// to the Slovak Banking Association specification.
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
	// standing order fields of Payment.
	PaymentOptionsStandingOrder PaymentOptions = 0b00000010

	// PaymentOptionsDirectDebit is a direct debit, its details in the direct
	// debit fields of Payment.
	PaymentOptionsDirectDebit PaymentOptions = 0b00000100
)

// BankAccount is where the money goes.
type BankAccount struct {
	IBAN string `json:"iban"`
	BIC  string `json:"bic,omitempty"`
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
	Name   string `json:"name"`
	Street string `json:"street,omitempty"`
	City   string `json:"city,omitempty"`
}

// SimplePayment holds the fields every payment has.
type SimplePayment struct {
	Amount                          float64       `json:"amount"`
	CurrencyCode                    CurrencyCode  `json:"currencyCode"`
	PaymentDueDate                  string        `json:"paymentDueDate,omitempty"`
	VariableSymbol                  string        `json:"variableSymbol,omitempty"`
	ConstantSymbol                  string        `json:"constantSymbol,omitempty"`
	SpecificSymbol                  string        `json:"specificSymbol,omitempty"`
	OriginatorsReferenceInformation string        `json:"originatorsReferenceInformation,omitempty"`
	PaymentNote                     string        `json:"paymentNote,omitempty"`
	BankAccounts                    []BankAccount `json:"bankAccounts"`
	Beneficiary                     Beneficiary   `json:"beneficiary"`
}

// Payment is one payment of any type: the SimplePayment fields, the standing
// order fields read when Type is PaymentOptionsStandingOrder, and the direct
// debit fields read when Type is PaymentOptionsDirectDebit. The TypeScript
// implementation spells this as the union PaymentOrder | StandingOrder |
// DirectDebit; the JSON is the same.
type Payment struct {
	Type PaymentOptions `json:"type"`

	SimplePayment

	// Standing order.
	Day         Day         `json:"day,omitempty"`
	Month       Month       `json:"month,omitempty"`
	Periodicity Periodicity `json:"periodicity,omitempty"`
	LastDate    string      `json:"lastDate,omitempty"`

	// Direct debit.
	DirectDebitScheme                 DirectDebitScheme `json:"directDebitScheme,omitempty"`
	DirectDebitType                   DirectDebitType   `json:"directDebitType,omitempty"`
	DdVariableSymbol                  string            `json:"ddVariableSymbol,omitempty"`
	DdSpecificSymbol                  string            `json:"ddSpecificSymbol,omitempty"`
	DdOriginatorsReferenceInformation string            `json:"ddOriginatorsReferenceInformation,omitempty"`
	MandateID                         string            `json:"mandateId,omitempty"`
	CreditorID                        string            `json:"creditorId,omitempty"`
	ContractID                        string            `json:"contractId,omitempty"`
	MaxAmount                         float64           `json:"maxAmount,omitempty"`
	ValidTillDate                     string            `json:"validTillDate,omitempty"`
}

// DataModel is the whole PAY by square document.
type DataModel struct {
	InvoiceID string    `json:"invoiceId,omitempty"`
	Payments  []Payment `json:"payments"`
}

// EncodeOptions steer Encode: Deburr strips diacritics from the free-text
// fields, Validate runs ValidateDataModel first, Version picks the header
// version.
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

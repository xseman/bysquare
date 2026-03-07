// Package pay implements PAY by square encoding and decoding.
//
// This package handles bysquareType=0x00 (PAY by square) data according
// to the Slovak Banking Association specification.
package pay

// PaymentType represents the type of payment.
type PaymentType uint8

const (
	PaymentTypePaymentOrder  PaymentType = 1
	PaymentTypeStandingOrder PaymentType = 2
	PaymentTypeDirectDebit   PaymentType = 4
)

// CurrencyCode represents ISO 4217 currency codes.
//
// The type accepts any valid ISO 4217 currency code (3 uppercase letters).
// Common Central European currencies are provided as constants for convenience,
// but any valid currency code can be used by casting a string to CurrencyCode.
type CurrencyCode string

const (
	CurrencyEUR CurrencyCode = "EUR"
	CurrencyCZK CurrencyCode = "CZK"
	CurrencyPLN CurrencyCode = "PLN"
	CurrencyHUF CurrencyCode = "HUF"
)

// Periodicity represents payment frequency.
type Periodicity string

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

// Month represents calendar months as bit flags.
type Month uint16

const (
	MonthJanuary   Month = 1 << 0
	MonthFebruary  Month = 1 << 1
	MonthMarch     Month = 1 << 2
	MonthApril     Month = 1 << 3
	MonthMay       Month = 1 << 4
	MonthJune      Month = 1 << 5
	MonthJuly      Month = 1 << 6
	MonthAugust    Month = 1 << 7
	MonthSeptember Month = 1 << 8
	MonthOctober   Month = 1 << 9
	MonthNovember  Month = 1 << 10
	MonthDecember  Month = 1 << 11
)

// DirectDebitScheme represents the direct debit scheme.
//
// @see Appendix A, Table 13
type DirectDebitScheme uint8

const (
	DirectDebitSchemeOther DirectDebitScheme = 0x00
	DirectDebitSchemeSepa  DirectDebitScheme = 0x01
)

// DirectDebitType represents the direct debit type.
//
// @see Appendix A, Table 12
type DirectDebitType uint8

const (
	DirectDebitTypeOneOff    DirectDebitType = 0x00
	DirectDebitTypeRecurrent DirectDebitType = 0x01
)

// BankAccount represents a bank account with IBAN and optional BIC.
type BankAccount struct {
	IBAN string `json:"iban" validate:"required,iban"`
	BIC  string `json:"bic,omitempty" validate:"omitempty,bic"`
}

// Beneficiary represents payment beneficiary information.
type Beneficiary struct {
	// Name is required since v1.2.0.
	Name   string `json:"name"`
	Street string `json:"street,omitempty"`
	City   string `json:"city,omitempty"`
}

// SimplePayment represents base payment fields.
type SimplePayment struct {
	Type                            PaymentType    `json:"type" validate:"required,min=1,max=4"`
	Amount                          float64        `json:"amount,omitempty"`
	CurrencyCode                    CurrencyCode   `json:"currencyCode,omitempty" validate:"omitempty,iso4217"`
	PaymentDueDate                  string         `json:"paymentDueDate,omitempty" validate:"omitempty,len=8,numeric"`
	VariableSymbol                  string         `json:"variableSymbol,omitempty"`
	ConstantSymbol                  string         `json:"constantSymbol,omitempty"`
	SpecificSymbol                  string         `json:"specificSymbol,omitempty"`
	OriginatorsReferenceInformation string         `json:"originatorsReferenceInformation,omitempty"`
	PaymentNote                     string         `json:"paymentNote,omitempty"`
	BankAccounts                    []BankAccount  `json:"bankAccounts" validate:"required,min=1,dive"`
	Beneficiary                     *Beneficiary   `json:"beneficiary" validate:"required"`
	StandingOrderExt                *StandingOrder `json:"standingOrderExt,omitempty"`
	DirectDebitExt                  *DirectDebit   `json:"directDebitExt,omitempty"`
}

// StandingOrder represents standing order extension fields.
type StandingOrder struct {
	Day         uint8       `json:"day" validate:"min=1,max=31"`
	Month       uint16      `json:"month,omitempty"`
	Periodicity Periodicity `json:"periodicity" validate:"required"`
	LastDate    string      `json:"lastDate,omitempty"`
}

// DirectDebit represents direct debit extension fields.
type DirectDebit struct {
	DirectDebitScheme        uint8   `json:"directDebitScheme,omitempty"`
	DirectDebitType          uint8   `json:"directDebitType,omitempty"`
	VariableSymbol           string  `json:"variableSymbol,omitempty"`
	SpecificSymbol           string  `json:"specificSymbol,omitempty"`
	OriginatorsReferenceInfo string  `json:"originatorsReferenceInformation,omitempty"`
	MandateID                string  `json:"mandateId,omitempty"`
	CreditorID               string  `json:"creditorId,omitempty"`
	ContractID               string  `json:"contractId,omitempty"`
	MaxAmount                float64 `json:"maxAmount,omitempty"`
	ValidTillDate            string  `json:"validTillDate,omitempty"`
}

// DataModel represents the complete payment data structure.
type DataModel struct {
	InvoiceID string          `json:"invoiceId,omitempty"`
	Payments  []SimplePayment `json:"payments" validate:"required,min=1,dive"`
}

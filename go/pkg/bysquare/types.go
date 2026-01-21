// Package bysquare implements the Slovak "PAY by square" QR payment standard.
//
// This package provides encoding and decoding functionality for generating
// and parsing QR codes compatible with the Slovak banking system according
// to the PAY by square specification adopted by the Slovak Banking Association.
package bysquare

// Version represents the BySquare format version.
type Version uint8

const (
	// Version100 - Created from original by square specifications.
	// Released Date: 2013-02-22
	Version100 Version = 0x00

	// Version110 - Added fields for beneficiary name and address.
	// Released Date: 2015-06-24
	Version110 Version = 0x01

	// Version120 - Beneficiary name is now a required field.
	// Released Date: 2025-04-01
	Version120 Version = 0x02
)

// PaymentType represents the type of payment.
type PaymentType uint8

const (
	PaymentTypePaymentOrder  PaymentType = 1
	PaymentTypeStandingOrder PaymentType = 2
	PaymentTypeDirectDebit   PaymentType = 3
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
	MonthJanuary   Month = 1 << 0  // 0b000000000001
	MonthFebruary  Month = 1 << 1  // 0b000000000010
	MonthMarch     Month = 1 << 2  // 0b000000000100
	MonthApril     Month = 1 << 3  // 0b000000001000
	MonthMay       Month = 1 << 4  // 0b000000010000
	MonthJune      Month = 1 << 5  // 0b000000100000
	MonthJuly      Month = 1 << 6  // 0b000001000000
	MonthAugust    Month = 1 << 7  // 0b000010000000
	MonthSeptember Month = 1 << 8  // 0b000100000000
	MonthOctober   Month = 1 << 9  // 0b001000000000
	MonthNovember  Month = 1 << 10 // 0b010000000000
	MonthDecember  Month = 1 << 11 // 0b100000000000
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
	Type                            PaymentType    `json:"type" validate:"required,min=1,max=3"`
	Amount                          float64        `json:"amount,omitempty"`
	CurrencyCode                    CurrencyCode   `json:"currencyCode,omitempty" validate:"omitempty,iso4217"`
	PaymentDueDate                  string         `json:"paymentDueDate,omitempty" validate:"omitempty,datetime=2006-01-02"`
	VariableSymbol                  string         `json:"variableSymbol,omitempty"`
	ConstantSymbol                  string         `json:"constantSymbol,omitempty"`
	SpecificSymbol                  string         `json:"specificSymbol,omitempty"`
	OriginatorsReferenceInformation string         `json:"originatorsReferenceInformation,omitempty"`
	PaymentNote                     string         `json:"paymentNote,omitempty"`
	BankAccounts                    []BankAccount  `json:"bankAccounts" validate:"required,min=1,dive"`
	// Beneficiary is required since v1.2.0.
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
	DirectDebitScheme        uint8  `json:"directDebitScheme,omitempty"`
	DirectDebitType          uint8  `json:"directDebitType,omitempty"`
	VariableSymbol           string `json:"variableSymbol,omitempty"`
	SpecificSymbol           string `json:"specificSymbol,omitempty"`
	OriginatorsReferenceInfo string `json:"originatorsReferenceInformation,omitempty"`
	MandateID                string `json:"mandateId,omitempty"`
	CreditorID               string `json:"creditorId,omitempty"`
	ContractID               string `json:"contractId,omitempty"`
	MaxAmount                string `json:"maxAmount,omitempty"`
	ValidTillDate            string `json:"validTillDate,omitempty"`
}

// DataModel represents the complete payment data structure.
type DataModel struct {
	InvoiceID string          `json:"invoiceId,omitempty"`
	Payments  []SimplePayment `json:"payments" validate:"required,min=1,dive"`
}

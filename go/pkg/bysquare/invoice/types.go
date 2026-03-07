// Package invoice implements Invoice by square encoding and decoding.
//
// This package handles bysquareType=0x01 (Invoice by square) data according
// to the Slovak Banking Association specification.
package invoice

// InvoiceDocumentType represents the document type within bysquareType=1.
type InvoiceDocumentType uint8

const (
	InvoiceDocumentTypeInvoice         InvoiceDocumentType = 0x00
	InvoiceDocumentTypeProformaInvoice InvoiceDocumentType = 0x01
	InvoiceDocumentTypeCreditNote      InvoiceDocumentType = 0x02
	InvoiceDocumentTypeDebitNote       InvoiceDocumentType = 0x03
	InvoiceDocumentTypeAdvanceInvoice  InvoiceDocumentType = 0x04
)

// PaymentMean represents payment means as bitmask values. Multiple values
// can be combined with bitwise OR.
//
// Each value corresponds to 1 << position where position is the zero-based
// declaration order defined in the specification.
type PaymentMean uint8

const (
	PaymentMeanMoneyTransfer  PaymentMean = 0b0000001
	PaymentMeanCash           PaymentMean = 0b0000010
	PaymentMeanCashOnDelivery PaymentMean = 0b0000100
	PaymentMeanCreditCard     PaymentMean = 0b0001000
	PaymentMeanAdvance        PaymentMean = 0b0010000
	PaymentMeanMutualOffset   PaymentMean = 0b0100000
	PaymentMeanOther          PaymentMean = 0b1000000
)

// Contact represents contact information.
type Contact struct {
	Name      string `json:"name,omitempty"`
	Telephone string `json:"telephone,omitempty"`
	Email     string `json:"email,omitempty"`
}

// PostalAddress represents a postal address.
type PostalAddress struct {
	StreetName     string `json:"streetName,omitempty"`
	BuildingNumber string `json:"buildingNumber,omitempty"`
	CityName       string `json:"cityName,omitempty"`
	PostalZone     string `json:"postalZone,omitempty"`
	State          string `json:"state,omitempty"`
	Country        string `json:"country,omitempty"`
}

// Party represents a business party.
type Party struct {
	PartyName         string `json:"partyName"`
	CompanyTaxID      string `json:"companyTaxId,omitempty"`
	CompanyVatID      string `json:"companyVatId,omitempty"`
	CompanyRegisterID string `json:"companyRegisterId,omitempty"`
}

// SupplierParty extends Party with postal address and optional contact.
type SupplierParty struct {
	Party
	PostalAddress PostalAddress `json:"postalAddress"`
	Contact       *Contact      `json:"contact,omitempty"`
}

// CustomerParty extends Party with optional party identification.
type CustomerParty struct {
	Party
	PartyIdentification string `json:"partyIdentification,omitempty"`
}

// SingleInvoiceLine represents a single invoice line item.
type SingleInvoiceLine struct {
	OrderLineID        string  `json:"orderLineId,omitempty"`
	DeliveryNoteLineID string  `json:"deliveryNoteLineId,omitempty"`
	ItemName           string  `json:"itemName,omitempty"`
	ItemEanCode        string  `json:"itemEanCode,omitempty"`
	PeriodFromDate     string  `json:"periodFromDate,omitempty"`
	PeriodToDate       string  `json:"periodToDate,omitempty"`
	InvoicedQuantity   float64 `json:"invoicedQuantity,omitempty"`
}

// TaxCategorySummary represents a tax category with amounts.
type TaxCategorySummary struct {
	// ClassifiedTaxCategory is a decimal in range [0, 1] representing the tax rate.
	ClassifiedTaxCategory            float64 `json:"classifiedTaxCategory"`
	TaxExclusiveAmount               float64 `json:"taxExclusiveAmount"`
	TaxAmount                        float64 `json:"taxAmount"`
	AlreadyClaimedTaxExclusiveAmount float64 `json:"alreadyClaimedTaxExclusiveAmount,omitempty"`
	AlreadyClaimedTaxAmount          float64 `json:"alreadyClaimedTaxAmount,omitempty"`
}

// MonetarySummary represents monetary summary information.
type MonetarySummary struct {
	PayableRoundingAmount float64 `json:"payableRoundingAmount,omitempty"`
	PaidDepositsAmount    float64 `json:"paidDepositsAmount,omitempty"`
}

// DataModel represents the complete invoice data structure.
type DataModel struct {
	DocumentType         InvoiceDocumentType  `json:"documentType"`
	InvoiceID            string               `json:"invoiceId"`
	IssueDate            string               `json:"issueDate"`
	TaxPointDate         string               `json:"taxPointDate,omitempty"`
	OrderID              string               `json:"orderId,omitempty"`
	DeliveryNoteID       string               `json:"deliveryNoteId,omitempty"`
	LocalCurrencyCode    string               `json:"localCurrencyCode"`
	ForeignCurrencyCode  string               `json:"foreignCurrencyCode,omitempty"`
	CurrRate             float64              `json:"currRate,omitempty"`
	ReferenceCurrRate    float64              `json:"referenceCurrRate,omitempty"`
	SupplierParty        SupplierParty        `json:"supplierParty"`
	CustomerParty        CustomerParty        `json:"customerParty"`
	NumberOfInvoiceLines *int                 `json:"numberOfInvoiceLines,omitempty"`
	InvoiceDescription   string               `json:"invoiceDescription,omitempty"`
	SingleInvoiceLine    *SingleInvoiceLine   `json:"singleInvoiceLine,omitempty"`
	TaxCategorySummaries []TaxCategorySummary `json:"taxCategorySummaries"`
	MonetarySummary      MonetarySummary      `json:"monetarySummary"`
	PaymentMeans         uint8                `json:"paymentMeans,omitempty"`
}

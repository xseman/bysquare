package invoice

import (
	"strconv"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/lzma"
)

// serialize transforms DataModel to a tab-separated intermediate format.
//
// Field order follows the specification (40 + N*5 fields):
//
//   - Fields 0-8: core invoice fields
//   - Fields 9-21: supplier party (13 fields)
//   - Fields 22-26: customer party (5 fields)
//   - Fields 27-28: invoice detail
//   - Fields 29-35: single invoice line (7 fields)
//   - Field 36: tax category summary count
//   - Fields 37..36+N*5: per summary (5 fields each)
//   - Monetary summary (2 fields)
//   - Payment means bitmask
func serialize(data DataModel) string {
	fields := make([]string, 0, 64)

	push := func(s string) {
		fields = append(fields, s)
	}

	pushFloat := func(f float64) {
		push(field.FormatFloat(f))
	}

	// Core fields (9)
	push(field.Sanitize(data.InvoiceID))
	push(field.Sanitize(data.IssueDate))
	push(field.Sanitize(data.TaxPointDate))
	push(field.Sanitize(data.OrderID))
	push(field.Sanitize(data.DeliveryNoteID))
	push(field.Sanitize(data.LocalCurrencyCode))
	push(field.Sanitize(data.ForeignCurrencyCode))
	pushFloat(data.CurrRate)
	pushFloat(data.ReferenceCurrRate)

	// Supplier party (13 fields)
	sp := data.SupplierParty
	push(field.Sanitize(sp.PartyName))
	push(field.Sanitize(sp.CompanyTaxID))
	push(field.Sanitize(sp.CompanyVatID))
	push(field.Sanitize(sp.CompanyRegisterID))

	pa := sp.PostalAddress
	push(field.Sanitize(pa.StreetName))
	push(field.Sanitize(pa.BuildingNumber))
	push(field.Sanitize(pa.CityName))
	push(field.Sanitize(pa.PostalZone))
	push(field.Sanitize(pa.State))
	push(field.Sanitize(pa.Country))

	if sp.Contact != nil {
		push(field.Sanitize(sp.Contact.Name))
		push(field.Sanitize(sp.Contact.Telephone))
		push(field.Sanitize(sp.Contact.Email))
	} else {
		push("")
		push("")
		push("")
	}

	// Customer party (5 fields)
	cp := data.CustomerParty
	push(field.Sanitize(cp.PartyName))
	push(field.Sanitize(cp.CompanyTaxID))
	push(field.Sanitize(cp.CompanyVatID))
	push(field.Sanitize(cp.CompanyRegisterID))
	push(field.Sanitize(cp.PartyIdentification))

	// Invoice detail
	if data.NumberOfInvoiceLines != nil {
		push(strconv.Itoa(*data.NumberOfInvoiceLines))
	} else {
		push("")
	}

	push(field.Sanitize(data.InvoiceDescription))

	// Single invoice line (7 fields)
	if data.SingleInvoiceLine != nil {
		line := data.SingleInvoiceLine
		push(field.Sanitize(line.OrderLineID))
		push(field.Sanitize(line.DeliveryNoteLineID))
		push(field.Sanitize(line.ItemName))
		push(field.Sanitize(line.ItemEanCode))
		push(field.Sanitize(line.PeriodFromDate))
		push(field.Sanitize(line.PeriodToDate))
		pushFloat(line.InvoicedQuantity)
	} else {
		for range 7 {
			push("")
		}
	}

	// Tax category summaries
	push(strconv.Itoa(len(data.TaxCategorySummaries)))

	for _, tcs := range data.TaxCategorySummaries {
		// classifiedTaxCategory, taxExclusiveAmount, taxAmount are required
		// fields where 0 is a valid value, so always serialize them (not
		// FormatFloat which returns "" for zero).
		push(field.FormatFloatRequired(tcs.ClassifiedTaxCategory))
		push(field.FormatFloatRequired(tcs.TaxExclusiveAmount))
		push(field.FormatFloatRequired(tcs.TaxAmount))
		pushFloat(tcs.AlreadyClaimedTaxExclusiveAmount)
		pushFloat(tcs.AlreadyClaimedTaxAmount)
	}

	// Monetary summary (2 fields)
	pushFloat(data.MonetarySummary.PayableRoundingAmount)
	pushFloat(data.MonetarySummary.PaidDepositsAmount)

	// Payment means bitmask
	if data.PaymentMeans != 0 {
		push(strconv.FormatUint(uint64(data.PaymentMeans), 10))
	} else {
		push("")
	}

	return strings.Join(fields, "	")
}

// EncodeOptions configures invoice encoding behavior.
type EncodeOptions struct {
	// Validate the data model before encoding.
	Validate bool

	// Version of the BySquare format to use.
	//
	// The official app only recognizes headers with version=0 and performs
	// strict equality matching, so version 1.0.0 is the only compatible value.
	Version bysquare.Version
}

func defaultEncodeOptions() EncodeOptions {
	return EncodeOptions{
		Validate: true,
		Version:  bysquare.Version100,
	}
}

// Encode turns the model into the QR string, the same pipeline as PAY by
// square: serialize, CRC32, LZMA without the stream header, then the header
// with bysquareType 1 and the model's documentType, the payload length, and
// base32hex.
//
// @see 3.16.
func Encode(model DataModel, opts ...EncodeOptions) (string, error) {
	options := defaultEncodeOptions()
	if len(opts) > 0 {
		options = opts[0]
	}

	if options.Validate {
		if err := ValidateDataModel(model); err != nil {
			return "", err
		}
	}

	payloadTabbed := serialize(model)
	payloadChecked := bysquare.AddChecksum(payloadTabbed)

	lzmaBody, err := lzma.Compress(payloadChecked)
	if err != nil {
		return "", err
	}

	header, err := bysquare.BuildBysquareHeader(0x01, uint8(options.Version), uint8(model.DocumentType), 0x00)
	if err != nil {
		return "", err
	}

	length, err := bysquare.BuildPayloadLength(len(payloadChecked))
	if err != nil {
		return "", err
	}

	output := make([]byte, 0, len(header)+len(length)+len(lzmaBody))
	output = append(output, header...)
	output = append(output, length...)
	output = append(output, lzmaBody...)

	return bysquare.EncodeBase32Hex(output, false), nil
}

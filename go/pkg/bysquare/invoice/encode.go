package invoice

import (
	"fmt"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
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
func serialize(data *DataModel) string {
	fields := make([]string, 0, 64)

	push := func(s string) {
		fields = append(fields, s)
	}

	pushFloat := func(f float64) {
		push(bysquare.FormatFloat(f))
	}

	// Core fields (9)
	push(bysquare.Sanitize(data.InvoiceID))
	push(bysquare.Sanitize(data.IssueDate))
	push(bysquare.Sanitize(data.TaxPointDate))
	push(bysquare.Sanitize(data.OrderID))
	push(bysquare.Sanitize(data.DeliveryNoteID))
	push(bysquare.Sanitize(data.LocalCurrencyCode))
	push(bysquare.Sanitize(data.ForeignCurrencyCode))
	pushFloat(data.CurrRate)
	pushFloat(data.ReferenceCurrRate)

	// Supplier party (13 fields)
	sp := data.SupplierParty
	push(bysquare.Sanitize(sp.PartyName))
	push(bysquare.Sanitize(sp.CompanyTaxID))
	push(bysquare.Sanitize(sp.CompanyVatID))
	push(bysquare.Sanitize(sp.CompanyRegisterID))

	pa := sp.PostalAddress
	push(bysquare.Sanitize(pa.StreetName))
	push(bysquare.Sanitize(pa.BuildingNumber))
	push(bysquare.Sanitize(pa.CityName))
	push(bysquare.Sanitize(pa.PostalZone))
	push(bysquare.Sanitize(pa.State))
	push(bysquare.Sanitize(pa.Country))

	if sp.Contact != nil {
		push(bysquare.Sanitize(sp.Contact.Name))
		push(bysquare.Sanitize(sp.Contact.Telephone))
		push(bysquare.Sanitize(sp.Contact.Email))
	} else {
		push("")
		push("")
		push("")
	}

	// Customer party (5 fields)
	cp := data.CustomerParty
	push(bysquare.Sanitize(cp.PartyName))
	push(bysquare.Sanitize(cp.CompanyTaxID))
	push(bysquare.Sanitize(cp.CompanyVatID))
	push(bysquare.Sanitize(cp.CompanyRegisterID))
	push(bysquare.Sanitize(cp.PartyIdentification))

	// Invoice detail
	if data.NumberOfInvoiceLines != nil {
		push(fmt.Sprintf("%d", *data.NumberOfInvoiceLines))
	} else {
		push("")
	}
	push(bysquare.Sanitize(data.InvoiceDescription))

	// Single invoice line (7 fields)
	if data.SingleInvoiceLine != nil {
		line := data.SingleInvoiceLine
		push(bysquare.Sanitize(line.OrderLineID))
		push(bysquare.Sanitize(line.DeliveryNoteLineID))
		push(bysquare.Sanitize(line.ItemName))
		push(bysquare.Sanitize(line.ItemEanCode))
		push(bysquare.Sanitize(line.PeriodFromDate))
		push(bysquare.Sanitize(line.PeriodToDate))
		pushFloat(line.InvoicedQuantity)
	} else {
		for i := 0; i < 7; i++ {
			push("")
		}
	}

	// Tax category summaries
	push(fmt.Sprintf("%d", len(data.TaxCategorySummaries)))
	for _, tcs := range data.TaxCategorySummaries {
		// classifiedTaxCategory, taxExclusiveAmount, taxAmount are required
		// fields where 0 is a valid value, so always serialize them (not
		// FormatFloat which returns "" for zero).
		push(bysquare.FormatFloatRequired(tcs.ClassifiedTaxCategory))
		push(bysquare.FormatFloatRequired(tcs.TaxExclusiveAmount))
		push(bysquare.FormatFloatRequired(tcs.TaxAmount))
		pushFloat(tcs.AlreadyClaimedTaxExclusiveAmount)
		pushFloat(tcs.AlreadyClaimedTaxAmount)
	}

	// Monetary summary (2 fields)
	pushFloat(data.MonetarySummary.PayableRoundingAmount)
	pushFloat(data.MonetarySummary.PaidDepositsAmount)

	// Payment means bitmask
	if data.PaymentMeans != 0 {
		push(fmt.Sprintf("%d", data.PaymentMeans))
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

// DefaultEncodeOptions returns sensible defaults for encoding.
func DefaultEncodeOptions() EncodeOptions {
	return EncodeOptions{
		Validate: true,
		Version:  bysquare.Version100,
	}
}

// Encode encodes an invoice data model into a QR string.
//
// Uses bysquareType=1 and the documentType from DataModel to build
// the header. The binary pipeline is shared with PAY by square:
// serialize -> CRC32 -> LZMA -> header + length -> base32hex.
//
// @see 3.16.
func Encode(model *DataModel, opts ...EncodeOptions) (string, error) {
	opt := DefaultEncodeOptions()
	if len(opts) > 0 {
		opt = opts[0]
	}

	if opt.Validate {
		if err := ValidateDataModel(model); err != nil {
			return "", err
		}
	}

	payloadTabbed := serialize(model)
	payloadChecked := bysquare.AddChecksum(payloadTabbed)

	payloadCompressed, err := bysquare.CompressLZMA(payloadChecked)
	if err != nil {
		return "", fmt.Errorf("LZMA compression failed: %w", err)
	}

	if len(payloadCompressed) < 13 {
		return "", fmt.Errorf("compressed payload too short")
	}
	lzmaBody := payloadCompressed[13:]

	bysquareType := uint8(0x01)
	header := bysquare.BuildBysquareHeader(bysquareType, uint8(opt.Version), uint8(model.DocumentType), 0x00)
	lengthBytes := bysquare.BuildPayloadLength(len(payloadChecked))

	output := make([]byte, 0, len(header)+len(lengthBytes)+len(lzmaBody))
	output = append(output, header...)
	output = append(output, lengthBytes...)
	output = append(output, lzmaBody...)

	return bysquare.EncodeBase32Hex(output, false), nil
}

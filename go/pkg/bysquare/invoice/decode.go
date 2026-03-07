package invoice

import (
	"encoding/binary"
	"fmt"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// deserialize parses a tab-separated intermediate format into DataModel.
//
// Field order follows the specification (40 + N*5 fields).
func deserialize(tabString string, documentType InvoiceDocumentType) (*DataModel, error) {
	data := strings.Split(tabString, "	")
	i := 0

	next := func() string {
		if i < len(data) {
			v := data[i]
			i++
			return v
		}
		i++
		return ""
	}

	nextString := func() string {
		v := next()
		if v == "" {
			return ""
		}
		return v
	}

	nextFloat := func() (float64, error) {
		return bysquare.ParseFloat(next())
	}

	nextInt := func() (int, error) {
		return bysquare.ParseNumber(next())
	}

	model := &DataModel{}
	model.DocumentType = documentType

	// Core fields (9)
	model.InvoiceID = nextString()
	model.IssueDate = nextString()
	model.TaxPointDate = nextString()
	model.OrderID = nextString()
	model.DeliveryNoteID = nextString()
	model.LocalCurrencyCode = nextString()
	model.ForeignCurrencyCode = nextString()

	var err error
	model.CurrRate, err = nextFloat()
	if err != nil {
		return nil, fmt.Errorf("invalid currRate: %w", err)
	}
	model.ReferenceCurrRate, err = nextFloat()
	if err != nil {
		return nil, fmt.Errorf("invalid referenceCurrRate: %w", err)
	}

	// Supplier party (13 fields)
	model.SupplierParty.PartyName = nextString()
	model.SupplierParty.CompanyTaxID = nextString()
	model.SupplierParty.CompanyVatID = nextString()
	model.SupplierParty.CompanyRegisterID = nextString()

	model.SupplierParty.PostalAddress.StreetName = nextString()
	model.SupplierParty.PostalAddress.BuildingNumber = nextString()
	model.SupplierParty.PostalAddress.CityName = nextString()
	model.SupplierParty.PostalAddress.PostalZone = nextString()
	model.SupplierParty.PostalAddress.State = nextString()
	model.SupplierParty.PostalAddress.Country = nextString()

	contactName := nextString()
	contactTelephone := nextString()
	contactEmail := nextString()
	if contactName != "" || contactTelephone != "" || contactEmail != "" {
		model.SupplierParty.Contact = &Contact{
			Name:      contactName,
			Telephone: contactTelephone,
			Email:     contactEmail,
		}
	}

	// Customer party (5 fields)
	model.CustomerParty.PartyName = nextString()
	model.CustomerParty.CompanyTaxID = nextString()
	model.CustomerParty.CompanyVatID = nextString()
	model.CustomerParty.CompanyRegisterID = nextString()
	model.CustomerParty.PartyIdentification = nextString()

	// Invoice detail
	numLines, err := nextInt()
	if err != nil {
		return nil, fmt.Errorf("invalid numberOfInvoiceLines: %w", err)
	}
	if numLines > 0 {
		model.NumberOfInvoiceLines = &numLines
	}
	model.InvoiceDescription = nextString()

	// Single invoice line (7 fields)
	lineOrderID := nextString()
	lineDeliveryNoteID := nextString()
	lineItemName := nextString()
	lineItemEanCode := nextString()
	linePeriodFrom := nextString()
	linePeriodTo := nextString()
	lineQuantity, err := nextFloat()
	if err != nil {
		return nil, fmt.Errorf("invalid invoicedQuantity: %w", err)
	}

	hasSingleLine := lineOrderID != "" ||
		lineDeliveryNoteID != "" ||
		lineItemName != "" ||
		lineItemEanCode != "" ||
		linePeriodFrom != "" ||
		linePeriodTo != "" ||
		lineQuantity != 0

	if hasSingleLine {
		model.SingleInvoiceLine = &SingleInvoiceLine{
			OrderLineID:        lineOrderID,
			DeliveryNoteLineID: lineDeliveryNoteID,
			ItemName:           lineItemName,
			ItemEanCode:        lineItemEanCode,
			PeriodFromDate:     linePeriodFrom,
			PeriodToDate:       linePeriodTo,
			InvoicedQuantity:   lineQuantity,
		}
	}

	// Tax category summaries
	taxCount, err := nextInt()
	if err != nil {
		return nil, fmt.Errorf("invalid tax category count: %w", err)
	}

	model.TaxCategorySummaries = make([]TaxCategorySummary, taxCount)
	for t := 0; t < taxCount; t++ {
		model.TaxCategorySummaries[t].ClassifiedTaxCategory, err = nextFloat()
		if err != nil {
			return nil, fmt.Errorf("invalid classifiedTaxCategory[%d]: %w", t, err)
		}
		model.TaxCategorySummaries[t].TaxExclusiveAmount, err = nextFloat()
		if err != nil {
			return nil, fmt.Errorf("invalid taxExclusiveAmount[%d]: %w", t, err)
		}
		model.TaxCategorySummaries[t].TaxAmount, err = nextFloat()
		if err != nil {
			return nil, fmt.Errorf("invalid taxAmount[%d]: %w", t, err)
		}
		model.TaxCategorySummaries[t].AlreadyClaimedTaxExclusiveAmount, err = nextFloat()
		if err != nil {
			return nil, fmt.Errorf("invalid alreadyClaimedTaxExclusiveAmount[%d]: %w", t, err)
		}
		model.TaxCategorySummaries[t].AlreadyClaimedTaxAmount, err = nextFloat()
		if err != nil {
			return nil, fmt.Errorf("invalid alreadyClaimedTaxAmount[%d]: %w", t, err)
		}
	}

	// Monetary summary (2 fields)
	model.MonetarySummary.PayableRoundingAmount, err = nextFloat()
	if err != nil {
		return nil, fmt.Errorf("invalid payableRoundingAmount: %w", err)
	}
	model.MonetarySummary.PaidDepositsAmount, err = nextFloat()
	if err != nil {
		return nil, fmt.Errorf("invalid paidDepositsAmount: %w", err)
	}

	// Payment means bitmask
	pm, err := nextInt()
	if err != nil {
		return nil, fmt.Errorf("invalid paymentMeans: %w", err)
	}
	model.PaymentMeans = uint8(pm)

	return model, nil
}

// Decode decodes a QR string into an invoice DataModel.
//
// Expects bysquareType=1 in the header. The documentType nibble determines the
// specific invoice subtype (Invoice, ProformaInvoice, CreditNote, DebitNote,
// AdvanceInvoice).
//
// @see 3.16.
func Decode(qr string) (*DataModel, error) {
	bytes, err := bysquare.DecodeBase32Hex(qr, true)
	if err != nil {
		return nil, fmt.Errorf("base32hex decode failed: %w", err)
	}

	if len(bytes) < 4 {
		return nil, fmt.Errorf("input too short: need at least 4 bytes, got %d", len(bytes))
	}

	header := bysquare.ParseBysquareHeader(bytes[:2])

	if header.BySquareType != 0x01 {
		return nil, fmt.Errorf("expected bysquareType 1 (Invoice), got %d", header.BySquareType)
	}

	if bysquare.Version(header.Version) > bysquare.Version120 {
		return nil, fmt.Errorf("unsupported version: %d", header.Version)
	}

	payloadLength := int(binary.LittleEndian.Uint16(bytes[2:4]))

	decompressed, err := bysquare.DecompressLZMA(bytes[4:], payloadLength)
	if err != nil {
		return nil, fmt.Errorf("LZMA decompression failed: %w", err)
	}

	if len(decompressed) < 4 {
		return nil, fmt.Errorf("decompressed data too short for checksum")
	}

	checksum := binary.LittleEndian.Uint32(decompressed[:4])
	body := string(decompressed[4:])

	computed := bysquare.Crc32Checksum(body)
	if checksum != computed {
		return nil, fmt.Errorf("CRC32 checksum mismatch: stored=%d computed=%d", checksum, computed)
	}

	return deserialize(body, InvoiceDocumentType(header.DocumentType))
}

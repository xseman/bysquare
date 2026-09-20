package invoice

import (
	"encoding/binary"
	"strconv"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/lzma"
)

// deserialize parses a tab-separated intermediate format into DataModel.
//
// Field order follows the specification (40 + N*5 fields).
func deserialize(tabString string, documentType InvoiceDocumentType) DataModel {
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

	nextFloat := func() float64 {
		return field.ParseFloat(next())
	}

	nextInt := func() int {
		return field.ParseNumber(next())
	}

	model := DataModel{DocumentType: documentType}

	// Core fields (9)
	model.InvoiceID = next()
	model.IssueDate = next()
	model.TaxPointDate = next()
	model.OrderID = next()
	model.DeliveryNoteID = next()
	model.LocalCurrencyCode = next()
	model.ForeignCurrencyCode = next()
	model.CurrRate = nextFloat()
	model.ReferenceCurrRate = nextFloat()

	// Supplier party (13 fields)
	model.SupplierParty.PartyName = next()
	model.SupplierParty.CompanyTaxID = next()
	model.SupplierParty.CompanyVatID = next()
	model.SupplierParty.CompanyRegisterID = next()

	model.SupplierParty.PostalAddress.StreetName = next()
	model.SupplierParty.PostalAddress.BuildingNumber = next()
	model.SupplierParty.PostalAddress.CityName = next()
	model.SupplierParty.PostalAddress.PostalZone = next()
	model.SupplierParty.PostalAddress.State = next()
	model.SupplierParty.PostalAddress.Country = next()

	contactName := next()
	contactTelephone := next()

	contactEmail := next()
	if contactName != "" || contactTelephone != "" || contactEmail != "" {
		model.SupplierParty.Contact = &Contact{
			Name:      contactName,
			Telephone: contactTelephone,
			Email:     contactEmail,
		}
	}

	// Customer party (5 fields)
	model.CustomerParty.PartyName = next()
	model.CustomerParty.CompanyTaxID = next()
	model.CustomerParty.CompanyVatID = next()
	model.CustomerParty.CompanyRegisterID = next()
	model.CustomerParty.PartyIdentification = next()

	// Invoice detail
	numLines := nextInt()

	if numLines > 0 {
		model.NumberOfInvoiceLines = &numLines
	}

	model.InvoiceDescription = next()

	// Single invoice line (7 fields)
	lineOrderID := next()
	lineDeliveryNoteID := next()
	lineItemName := next()
	lineItemEanCode := next()
	linePeriodFrom := next()
	linePeriodTo := next()
	lineQuantity := nextFloat()

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
	taxCount := nextInt()

	model.TaxCategorySummaries = make([]TaxCategorySummary, taxCount)
	for t := range taxCount {
		model.TaxCategorySummaries[t] = TaxCategorySummary{
			ClassifiedTaxCategory:            nextFloat(),
			TaxExclusiveAmount:               nextFloat(),
			TaxAmount:                        nextFloat(),
			AlreadyClaimedTaxExclusiveAmount: nextFloat(),
			AlreadyClaimedTaxAmount:          nextFloat(),
		}
	}

	// Monetary summary (2 fields)
	model.MonetarySummary.PayableRoundingAmount = nextFloat()
	model.MonetarySummary.PaidDepositsAmount = nextFloat()

	// Payment means bitmask
	pm := nextInt()

	model.PaymentMeans = uint8(pm)

	return model
}

// Decode parses the QR string back into the model. The header must carry
// bysquareType 1; its documentType nibble picks the invoice subtype.
//
// Input binary structure (after base32hex decoding):
//
//	+------------------+------------------+-----------------------------+
//	|     2 bytes      |     2 bytes      |          Variable           |
//	+------------------+------------------+-----------------------------+
//	| Bysquare Header  | Payload Length   |         LZMA Body           |
//	| (4 nibbles)      | (little-endian)  |  (compressed CRC+payload)   |
//	+------------------+------------------+-----------------------------+
//
// After LZMA decompression:
//
//	+------------------+---------------------------+
//	|      4 bytes     |        Variable           |
//	+------------------+---------------------------+
//	| CRC32 Checksum   | Tab-separated payload     |
//	| (little-endian)  | (UTF-8 encoded)           |
//	+------------------+---------------------------+
//
// @see 3.16.
func Decode(qr string) (DataModel, error) {
	bytes, err := bysquare.DecodeBase32Hex(qr, true)
	if err != nil {
		return DataModel{}, err
	}

	headerData := bysquare.DecodeHeader(bytes)

	if headerData.BysquareType != 0x01 {
		return DataModel{}, &bysquare.DecodeError{
			Message:    "Expected bysquareType 1 (Invoice), got " + strconv.Itoa(int(headerData.BysquareType)),
			Extensions: map[string]any{"bysquareType": headerData.BysquareType},
		}
	}

	if headerData.Version > uint8(bysquare.Version120) {
		return DataModel{}, &bysquare.DecodeError{
			Message:    bysquare.DecodeErrorMessage.UnsupportedVersion,
			Extensions: map[string]any{"version": headerData.Version},
		}
	}

	if len(bytes) < 4 {
		return DataModel{}, &bysquare.DecodeError{
			Message:    bysquare.DecodeErrorMessage.LZMADecompressionFailed,
			Extensions: map[string]any{"error": "Input is shorter than the header and payload length"},
		}
	}

	payloadLength := binary.LittleEndian.Uint16(bytes[2:4])

	decompressed, err := lzma.Decompress(bytes[4:], int(payloadLength))
	if err != nil {
		return DataModel{}, &bysquare.DecodeError{
			Message:    bysquare.DecodeErrorMessage.LZMADecompressionFailed,
			Extensions: map[string]any{"error": err},
		}
	}

	if len(decompressed) < 4 {
		return DataModel{}, &bysquare.DecodeError{
			Message:    bysquare.DecodeErrorMessage.LZMADecompressionFailed,
			Extensions: map[string]any{"error": "Decompressed payload is shorter than the CRC32 checksum"},
		}
	}

	storedChecksum := binary.LittleEndian.Uint32(decompressed[0:4])
	decoded := string(decompressed[4:])

	computedChecksum := bysquare.CRC32(decoded)
	if storedChecksum != computedChecksum {
		return DataModel{}, &bysquare.DecodeError{
			Message:    "CRC32 checksum mismatch",
			Extensions: map[string]any{"stored": storedChecksum, "computed": computedChecksum},
		}
	}

	return deserialize(decoded, InvoiceDocumentType(headerData.DocumentType)), nil
}

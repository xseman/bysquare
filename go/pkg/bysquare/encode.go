package bysquare

import (
	"encoding/binary"
	"fmt"
	"strings"
)

const (
	maxCompressedSize = 131_072 // 2^17
)

// EncodeOptions configures the encoding process.
type EncodeOptions struct {
	// Deburr removes diacritics from text fields.
	Deburr bool
	// Validate performs validation before encoding.
	Validate bool
	// Version specifies the BySquare format version.
	Version Version
}

// DefaultEncodeOptions returns default encoding options.
func DefaultEncodeOptions() EncodeOptions {
	return EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  Version120,
	}
}

// Encode generates a BySquare QR string from the data model.
//
// The encoding process:
// 1. Optional diacritics removal (deburr)
// 2. Optional validation
// 3. Serialization to tab-separated format
// 4. CRC32 checksum addition
// 5. LZMA compression
// 6. Binary header construction
// 7. Base32Hex encoding
//
// Complete BySquare QR binary structure:
//
//	+------------------+------------------+-----------------------------+
//	|     2 bytes      |     2 bytes      |          Variable           |
//	+------------------+------------------+-----------------------------+
//	| Bysquare Header  | Payload Length   |         LZMA Body           |
//	| (4 nibbles)      | (little-endian)  |  (compressed CRC+payload)   |
//	+------------------+------------------+-----------------------------+
func Encode(model DataModel, opts ...EncodeOptions) (string, error) {
	options := DefaultEncodeOptions()
	if len(opts) > 0 {
		options = opts[0]
	}

	// Apply deburr (remove diacritics) if enabled
	if options.Deburr {
		removeDiacritics(&model)
	}

	// Validate if enabled
	if options.Validate {
		if err := validateDataModel(&model); err != nil {
			return "", err
		}
	}

	// Serialize data model to tab-separated format
	payloadTabbed := serialize(model)

	// Add CRC32 checksum
	payloadChecked := addChecksum(payloadTabbed)

	// Compress with LZMA
	payloadCompressed, err := compressLZMA(payloadChecked)
	if err != nil {
		return "", fmt.Errorf("LZMA compression failed: %w", err)
	}

	// Extract LZMA body (skip 13-byte header)
	if len(payloadCompressed) < 13 {
		return "", fmt.Errorf("compressed payload too short")
	}
	lzmaBody := payloadCompressed[13:]

	// Build BySquare header
	header := buildBysquareHeader(0x00, uint8(options.Version), 0x00, 0x00)

	// Build payload length (2 bytes, little-endian)
	payloadLength := buildPayloadLength(len(payloadChecked))

	// Combine all parts
	output := make([]byte, 0, len(header)+len(payloadLength)+len(lzmaBody))
	output = append(output, header...)
	output = append(output, payloadLength...)
	output = append(output, lzmaBody...)

	// Encode to Base32Hex
	return encodeBase32Hex(output, false), nil
}

// buildBysquareHeader creates a 2-byte header.
//
// Header structure (4 nibbles):
//
//	| Attribute    | Bits | Values | Description                 |
//	|--------------|------|--------|-----------------------------|
//	| BySquareType | 4    | 0-15   | By square type              |
//	| Version      | 4    | 0-15   | Version of by square type   |
//	| DocumentType | 4    | 0-15   | Document type               |
//	| Reserved     | 4    | 0-15   | Reserved for future use     |
func buildBysquareHeader(bySquareType, version, docType, reserved uint8) []byte {
	if bySquareType > 0x0F || version > 0x0F || docType > 0x0F || reserved > 0x0F {
		panic("header values must be 4-bit (0-15)")
	}

	header := make([]byte, 2)
	header[0] = (bySquareType << 4) | version
	header[1] = (docType << 4) | reserved

	return header
}

// buildPayloadLength creates a 2-byte little-endian length field.
func buildPayloadLength(length int) []byte {
	if length >= maxCompressedSize {
		panic(fmt.Sprintf("payload length %d exceeds maximum %d", length, maxCompressedSize))
	}

	buf := make([]byte, 2)
	binary.LittleEndian.PutUint16(buf, uint16(length))
	return buf
}

// serialize converts DataModel to tab-separated format.
//
// Format matches TypeScript implementation exactly.
func serialize(model DataModel) string {
	parts := make([]string, 0, 100)

	// Base fields
	parts = append(parts, model.InvoiceID)
	parts = append(parts, fmt.Sprintf("%d", len(model.Payments)))

	// Payment blocks
	for _, payment := range model.Payments {
		parts = append(parts, fmt.Sprintf("%d", payment.Type))
		parts = append(parts, formatFloat(payment.Amount))
		parts = append(parts, string(payment.CurrencyCode))
		parts = append(parts, serializeDate(payment.PaymentDueDate))
		parts = append(parts, payment.VariableSymbol)
		parts = append(parts, payment.ConstantSymbol)
		parts = append(parts, payment.SpecificSymbol)
		parts = append(parts, payment.OriginatorsReferenceInformation)
		parts = append(parts, payment.PaymentNote)

		// Bank accounts
		parts = append(parts, fmt.Sprintf("%d", len(payment.BankAccounts)))
		for _, account := range payment.BankAccounts {
			parts = append(parts, account.IBAN)
			parts = append(parts, account.BIC)
		}

		// Standing order extension
		if payment.Type == PaymentTypeStandingOrder && payment.StandingOrderExt != nil {
			parts = append(parts, "1")
			parts = append(parts, fmt.Sprintf("%d", payment.StandingOrderExt.Day))
			parts = append(parts, fmt.Sprintf("%d", payment.StandingOrderExt.Month))
			parts = append(parts, string(payment.StandingOrderExt.Periodicity))
			parts = append(parts, payment.StandingOrderExt.LastDate)
		} else {
			parts = append(parts, "0")
		}

		// Direct debit extension
		if payment.Type == PaymentTypeDirectDebit && payment.DirectDebitExt != nil {
			parts = append(parts, "1")
			parts = append(parts, fmt.Sprintf("%d", payment.DirectDebitExt.DirectDebitScheme))
			parts = append(parts, fmt.Sprintf("%d", payment.DirectDebitExt.DirectDebitType))
			parts = append(parts, payment.DirectDebitExt.VariableSymbol)
			parts = append(parts, payment.DirectDebitExt.SpecificSymbol)
			parts = append(parts, payment.DirectDebitExt.OriginatorsReferenceInfo)
			parts = append(parts, payment.DirectDebitExt.MandateID)
			parts = append(parts, payment.DirectDebitExt.CreditorID)
			parts = append(parts, payment.DirectDebitExt.ContractID)
			parts = append(parts, payment.DirectDebitExt.MaxAmount)
			parts = append(parts, payment.DirectDebitExt.ValidTillDate)
		} else {
			parts = append(parts, "0")
		}
	}

	// Beneficiary blocks (one per payment)
	for _, payment := range model.Payments {
		if payment.Beneficiary != nil {
			parts = append(parts, payment.Beneficiary.Name)
			parts = append(parts, payment.Beneficiary.Street)
			parts = append(parts, payment.Beneficiary.City)
		} else {
			parts = append(parts, "", "", "")
		}
	}

	return strings.Join(parts, "\t")
}

// serializeDate converts ISO 8601 date (YYYY-MM-DD) to YYYYMMDD format.
func serializeDate(date string) string {
	if date == "" {
		return ""
	}
	return strings.ReplaceAll(date, "-", "")
}

// formatFloat formats a float64 to string, omitting if zero.
func formatFloat(f float64) string {
	if f == 0 {
		return ""
	}
	// Use 'f' format with -1 precision to remove trailing zeros
	// This matches TypeScript's Number.toString() behavior
	s := fmt.Sprintf("%f", f)
	// Remove trailing zeros and decimal point if not needed
	s = strings.TrimRight(s, "0")
	s = strings.TrimRight(s, ".")
	return s
}

// addChecksum prepends CRC32 checksum to payload.
func addChecksum(payload string) []byte {
	// TODO: Implement CRC32 checksum
	checksum := crc32Checksum(payload)

	// Create result buffer: 4 bytes (checksum) + payload
	result := make([]byte, 4+len(payload))
	binary.LittleEndian.PutUint32(result[0:4], checksum)
	copy(result[4:], []byte(payload))

	return result
}

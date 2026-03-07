package pay

import (
	"fmt"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// EncodeOptions configures the encoding process.
type EncodeOptions struct {
	// Deburr removes diacritics from text fields.
	Deburr bool
	// Validate performs validation before encoding.
	Validate bool
	// Version specifies the BySquare format version.
	Version bysquare.Version
}

// DefaultEncodeOptions returns default encoding options.
func DefaultEncodeOptions() EncodeOptions {
	return EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
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

	if options.Deburr {
		removeDiacritics(&model)
	}

	if options.Validate {
		if err := ValidateDataModel(&model, options.Version); err != nil {
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

	header := bysquare.BuildBysquareHeader(0x00, uint8(options.Version), 0x00, 0x00)
	payloadLength := bysquare.BuildPayloadLength(len(payloadChecked))

	output := make([]byte, 0, len(header)+len(payloadLength)+len(lzmaBody))
	output = append(output, header...)
	output = append(output, payloadLength...)
	output = append(output, lzmaBody...)

	return bysquare.EncodeBase32Hex(output, false), nil
}

// serialize converts DataModel to tab-separated format.
func serialize(model DataModel) string {
	parts := make([]string, 0, 100)

	parts = append(parts, bysquare.Sanitize(model.InvoiceID))
	parts = append(parts, fmt.Sprintf("%d", len(model.Payments)))

	for _, payment := range model.Payments {
		parts = append(parts, fmt.Sprintf("%d", payment.Type))
		parts = append(parts, bysquare.FormatFloat(payment.Amount))
		parts = append(parts, bysquare.Sanitize(string(payment.CurrencyCode)))
		parts = append(parts, bysquare.Sanitize(payment.PaymentDueDate))
		parts = append(parts, bysquare.Sanitize(payment.VariableSymbol))
		parts = append(parts, bysquare.Sanitize(payment.ConstantSymbol))
		parts = append(parts, bysquare.Sanitize(payment.SpecificSymbol))
		parts = append(parts, bysquare.Sanitize(payment.OriginatorsReferenceInformation))
		parts = append(parts, bysquare.Sanitize(payment.PaymentNote))

		parts = append(parts, fmt.Sprintf("%d", len(payment.BankAccounts)))
		for _, account := range payment.BankAccounts {
			parts = append(parts, bysquare.Sanitize(account.IBAN))
			parts = append(parts, bysquare.Sanitize(account.BIC))
		}

		if payment.Type == PaymentTypeStandingOrder && payment.StandingOrderExt != nil {
			parts = append(parts, "1")
			parts = append(parts, fmt.Sprintf("%d", payment.StandingOrderExt.Day))
			parts = append(parts, fmt.Sprintf("%d", payment.StandingOrderExt.Month))
			parts = append(parts, bysquare.Sanitize(string(payment.StandingOrderExt.Periodicity)))
			parts = append(parts, bysquare.Sanitize(payment.StandingOrderExt.LastDate))
		} else {
			parts = append(parts, "0")
		}

		if payment.Type == PaymentTypeDirectDebit && payment.DirectDebitExt != nil {
			parts = append(parts, "1")
			parts = append(parts, fmt.Sprintf("%d", payment.DirectDebitExt.DirectDebitScheme))
			parts = append(parts, fmt.Sprintf("%d", payment.DirectDebitExt.DirectDebitType))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.VariableSymbol))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.SpecificSymbol))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.OriginatorsReferenceInfo))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.MandateID))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.CreditorID))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.ContractID))
			parts = append(parts, bysquare.FormatFloat(payment.DirectDebitExt.MaxAmount))
			parts = append(parts, bysquare.Sanitize(payment.DirectDebitExt.ValidTillDate))
		} else {
			parts = append(parts, "0")
		}
	}

	for _, payment := range model.Payments {
		if payment.Beneficiary != nil {
			parts = append(parts, bysquare.Sanitize(payment.Beneficiary.Name))
			parts = append(parts, bysquare.Sanitize(payment.Beneficiary.Street))
			parts = append(parts, bysquare.Sanitize(payment.Beneficiary.City))
		} else {
			parts = append(parts, "", "", "")
		}
	}

	return strings.Join(parts, "\t")
}

// removeDiacritics replaces diacritical marks in user-facing text fields.
func removeDiacritics(model *DataModel) {
	for i := range model.Payments {
		payment := &model.Payments[i]
		if payment.PaymentNote != "" {
			payment.PaymentNote = bysquare.Deburr(payment.PaymentNote)
		}
		if payment.Beneficiary != nil {
			if payment.Beneficiary.Name != "" {
				payment.Beneficiary.Name = bysquare.Deburr(payment.Beneficiary.Name)
			}
			if payment.Beneficiary.Street != "" {
				payment.Beneficiary.Street = bysquare.Deburr(payment.Beneficiary.Street)
			}
			if payment.Beneficiary.City != "" {
				payment.Beneficiary.City = bysquare.Deburr(payment.Beneficiary.City)
			}
		}
	}
}

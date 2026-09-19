package pay

import (
	"strconv"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/lzma"
)

func defaultEncodeOptions() EncodeOptions {
	return EncodeOptions{Deburr: true, Validate: true, Version: bysquare.Version120}
}

// serialize lays the model out as the tab-separated payload: the header
// fields, every payment with its accounts and extensions, then every
// payment's beneficiary.
//
// @see 3.8.
func serialize(data DataModel) string {
	s := make([]string, 0, 32)

	s = append(s, field.Sanitize(data.InvoiceID), strconv.Itoa(len(data.Payments)))

	for _, p := range data.Payments {
		s = append(s,
			strconv.Itoa(int(p.Type)),
			field.FormatFloatRequired(p.Amount), // TypeScript decodes a missing amount as 0 and prints it back
			field.Sanitize(string(p.CurrencyCode)),
			field.Sanitize(p.PaymentDueDate),
			field.Sanitize(p.VariableSymbol),
			field.Sanitize(p.ConstantSymbol),
			field.Sanitize(p.SpecificSymbol),
			field.Sanitize(p.OriginatorsReferenceInformation),
			field.Sanitize(p.PaymentNote),
			strconv.Itoa(len(p.BankAccounts)),
		)

		for _, ba := range p.BankAccounts {
			s = append(s, field.Sanitize(ba.IBAN), field.Sanitize(ba.BIC))
		}

		if p.Type == PaymentOptionsStandingOrder {
			s = append(s,
				"1",
				field.FormatInt(int(p.Day)),
				field.FormatInt(int(p.Month)),
				field.Sanitize(string(p.Periodicity)),
				field.Sanitize(p.LastDate),
			)
		} else {
			s = append(s, "0")
		}

		if p.Type == PaymentOptionsDirectDebit {
			s = append(s,
				"1",
				field.FormatInt(int(p.DirectDebitScheme)),
				field.FormatInt(int(p.DirectDebitType)),
				field.Sanitize(p.DdVariableSymbol),
				field.Sanitize(p.DdSpecificSymbol),
				field.Sanitize(p.DdOriginatorsReferenceInformation),
				field.Sanitize(p.MandateID),
				field.Sanitize(p.CreditorID),
				field.Sanitize(p.ContractID),
				field.FormatFloat(p.MaxAmount),
				field.Sanitize(p.ValidTillDate),
			)
		} else {
			s = append(s, "0")
		}
	}

	for _, p := range data.Payments {
		s = append(s,
			field.Sanitize(p.Beneficiary.Name),
			field.Sanitize(p.Beneficiary.Street),
			field.Sanitize(p.Beneficiary.City),
		)
	}

	return strings.Join(s, "\t")
}

// removeDiacritics deburrs the free-text fields in place.
func removeDiacritics(model *DataModel) {
	for i := range model.Payments {
		payment := &model.Payments[i]
		payment.PaymentNote = bysquare.Deburr(payment.PaymentNote)
		payment.Beneficiary.Name = bysquare.Deburr(payment.Beneficiary.Name)
		payment.Beneficiary.City = bysquare.Deburr(payment.Beneficiary.City)
		payment.Beneficiary.Street = bysquare.Deburr(payment.Beneficiary.Street)
	}
}

// Encode turns the model into the QR string: deburred and validated by
// default, serialized, checksummed, LZMA-compressed without the stream
// header, framed by the bysquare header and the payload length, then
// base32hex without padding.
//
// Complete BySquare QR binary structure:
//
//	+------------------+------------------+-----------------------------+
//	|     2 bytes      |     2 bytes      |          Variable           |
//	+------------------+------------------+-----------------------------+
//	| Bysquare Header  | Payload Length   |         LZMA Body           |
//	| (4 nibbles)      | (little-endian)  |  (compressed CRC+payload)   |
//	+------------------+------------------+-----------------------------+
//	        |                  |                       |
//	        v                  v                       v
//	+-----+-----+-----+-----+  +-----+-----+  +---------+-----------+
//	| 4b  | 4b  | 4b  | 4b  |  | LSB | MSB |  | Header  | Body      |
//	+-----+-----+-----+-----+  +-----+-----+  | (13B)   | (var)     |
//	| Type| Ver | Doc |Resv |  |   Length  |  | omitted |           |
//	+-----+-----+-----+-----+  +-----------+  +---------+-----------+
//	                                                      |
//	                                                      v
//	                                          +--------+-------------+
//	                                          | CRC32  | Tab-sep     |
//	                                          | (4B)   | payload     |
//	                                          +--------+-------------+
//
// @see 3.16.
func Encode(model DataModel, opts ...EncodeOptions) (string, error) {
	options := defaultEncodeOptions()
	if len(opts) > 0 {
		options = opts[0]
	}

	if options.Deburr {
		removeDiacritics(&model)
	}

	if options.Validate {
		if err := ValidateDataModel(model, options.Version); err != nil {
			return "", err
		}
	}

	payloadTabbed := serialize(model)
	payloadChecked := bysquare.AddChecksum(payloadTabbed)

	payloadCompressed, err := lzma.Compress(payloadChecked)
	if err != nil {
		return "", err
	}

	lzmaBody := payloadCompressed[13:] // the stream header, which the QR leaves out

	header, err := bysquare.BuildBysquareHeader(0x00, uint8(options.Version), 0x00, 0x00)
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

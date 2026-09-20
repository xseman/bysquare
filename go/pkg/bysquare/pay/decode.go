package pay

import (
	"encoding/binary"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/lzma"
)

// deserialize reads the tab-separated payload back into the model. Fields
// past the end read as empty, as they do in the TypeScript implementation.
func deserialize(tabString string) (DataModel, error) {
	data := strings.Split(tabString, "\t")
	i := 0

	next := func() string {
		if i >= len(data) {
			return ""
		}

		value := data[i]
		i++

		return value
	}

	invoiceID := next()

	// A count never exceeds the fields left; a foreign payload (an invoice fed
	// to this decoder) would otherwise ask for millions of empty payments.
	paymentsCount := min(field.ParseNumber(next()), len(data))

	payments := make([]Payment, 0, max(paymentsCount, 0))

	for range paymentsCount {
		paymentType := field.ParseNumber(next())
		amount := field.ParseFloat(next())

		payment := Payment{
			Type: PaymentOptions(paymentType),
			SimplePayment: SimplePayment{
				Amount:                          amount,
				CurrencyCode:                    CurrencyCode(next()),
				PaymentDueDate:                  next(),
				VariableSymbol:                  next(),
				ConstantSymbol:                  next(),
				SpecificSymbol:                  next(),
				OriginatorsReferenceInformation: next(),
				PaymentNote:                     next(),
				BankAccounts:                    []BankAccount{},
			},
		}

		bankAccountsCount := min(field.ParseNumber(next()), len(data))

		for range bankAccountsCount {
			iban := next()
			if iban == "" {
				return DataModel{}, &bysquare.DecodeError{Message: bysquare.DecodeErrorMessage.MissingIBAN}
			}

			payment.BankAccounts = append(payment.BankAccounts, BankAccount{IBAN: iban, BIC: next()})
		}

		// The extension fields are consumed whenever the flag is "1", whatever
		// the payment type, to keep the rest aligned.
		if next() == "1" {
			day := field.ParseNumber(next())
			month := field.ParseNumber(next())
			periodicity := Periodicity(next())
			lastDate := next()

			if payment.Type == PaymentOptionsStandingOrder {
				payment.Day = Day(day)
				payment.Month = Month(month)
				payment.Periodicity = periodicity
				payment.LastDate = lastDate
			}
		}

		if next() == "1" {
			scheme := field.ParseNumber(next())
			ddType := field.ParseNumber(next())
			ddVariableSymbol := next()
			ddSpecificSymbol := next()
			ddOriginatorsReferenceInformation := next()
			mandateID := next()
			creditorID := next()
			contractID := next()
			maxAmount := field.ParseFloat(next())
			validTillDate := next()

			if payment.Type == PaymentOptionsDirectDebit {
				payment.DirectDebitScheme = DirectDebitScheme(scheme)
				payment.DirectDebitType = DirectDebitType(ddType)
				payment.DdVariableSymbol = ddVariableSymbol
				payment.DdSpecificSymbol = ddSpecificSymbol
				payment.DdOriginatorsReferenceInformation = ddOriginatorsReferenceInformation
				payment.MandateID = mandateID
				payment.CreditorID = creditorID
				payment.ContractID = contractID
				payment.MaxAmount = maxAmount
				payment.ValidTillDate = validTillDate
			}
		}

		payments = append(payments, payment)
	}

	// The beneficiary block follows all payments.
	for p := range payments {
		payments[p].Beneficiary = Beneficiary{
			Name:   next(),
			Street: next(),
			City:   next(),
		}
	}

	return DataModel{InvoiceID: invoiceID, Payments: payments}, nil
}

// Decode parses the QR string back into the model: base32hex, the two-byte
// header and the two-byte payload length, LZMA body, then the CRC32 the
// payload was checksummed with.
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

	return deserialize(decoded)
}

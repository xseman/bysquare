package pay

import (
	"encoding/binary"
	"fmt"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// ErrMissingBankAccount indicates no bank accounts provided.
var ErrMissingBankAccount = fmt.Errorf("at least one bank account required")

// Decode parses a BySquare QR string back to DataModel.
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
		return DataModel{}, fmt.Errorf("base32hex decode failed: %w", err)
	}

	if len(bytes) < 4 {
		return DataModel{}, fmt.Errorf("invalid data: too short")
	}

	headerBytes := bytes[0:2]
	header := bysquare.ParseBysquareHeader(headerBytes)

	if header.Version > uint8(bysquare.Version120) {
		return DataModel{}, fmt.Errorf("unsupported version: %d", header.Version)
	}

	payloadLengthBytes := bytes[2:4]
	payloadLength := binary.LittleEndian.Uint16(payloadLengthBytes)

	compressed := bytes[4:]

	decompressed, err := bysquare.DecompressLZMA(compressed, int(payloadLength))
	if err != nil {
		return DataModel{}, fmt.Errorf("LZMA decompression failed: %w", err)
	}

	if len(decompressed) < 4 {
		return DataModel{}, fmt.Errorf("decompressed data too short")
	}

	checksumBytes := decompressed[0:4]
	expectedChecksum := binary.LittleEndian.Uint32(checksumBytes)

	payload := decompressed[4:]
	payloadStr := string(payload)

	actualChecksum := bysquare.Crc32Checksum(payloadStr)
	if actualChecksum != expectedChecksum {
		return DataModel{}, fmt.Errorf("CRC32 checksum mismatch")
	}

	model, err := deserialize(payloadStr)
	if err != nil {
		return DataModel{}, fmt.Errorf("deserialization failed: %w", err)
	}

	return model, nil
}

// deserialize parses tab-separated format to DataModel.
func deserialize(data string) (DataModel, error) {
	parts := strings.Split(data, "\t")
	idx := 0

	if len(parts) < 2 {
		return DataModel{}, fmt.Errorf("insufficient data fields")
	}

	invoiceID := parts[idx]
	idx++

	paymentsCount, err := bysquare.ParseNumber(parts[idx])
	if err != nil {
		return DataModel{}, fmt.Errorf("invalid payments count: %w", err)
	}
	idx++

	model := DataModel{
		InvoiceID: invoiceID,
		Payments:  make([]SimplePayment, 0, paymentsCount),
	}

	for i := 0; i < paymentsCount; i++ {
		if idx+9 > len(parts) {
			return DataModel{}, fmt.Errorf("insufficient payment fields")
		}

		paymentType, _ := bysquare.ParseNumber(parts[idx])
		idx++
		amount, _ := bysquare.ParseFloat(parts[idx])
		idx++
		currencyCode := parts[idx]
		idx++
		paymentDueDate := parts[idx]
		idx++
		variableSymbol := parts[idx]
		idx++
		constantSymbol := parts[idx]
		idx++
		specificSymbol := parts[idx]
		idx++
		originatorsRefInfo := parts[idx]
		idx++
		paymentNote := parts[idx]
		idx++

		payment := SimplePayment{
			Type:                            PaymentType(paymentType),
			Amount:                          amount,
			CurrencyCode:                    CurrencyCode(currencyCode),
			PaymentDueDate:                  paymentDueDate,
			VariableSymbol:                  variableSymbol,
			ConstantSymbol:                  constantSymbol,
			SpecificSymbol:                  specificSymbol,
			OriginatorsReferenceInformation: originatorsRefInfo,
			PaymentNote:                     paymentNote,
			BankAccounts:                    []BankAccount{},
		}

		accountsCount, _ := bysquare.ParseNumber(parts[idx])
		idx++

		for j := 0; j < accountsCount; j++ {
			if idx+2 > len(parts) {
				return DataModel{}, fmt.Errorf("insufficient bank account fields")
			}

			iban := parts[idx]
			idx++
			if iban == "" {
				return DataModel{}, ErrMissingBankAccount
			}

			bic := parts[idx]
			idx++

			payment.BankAccounts = append(payment.BankAccounts, BankAccount{
				IBAN: iban,
				BIC:  bic,
			})
		}

		// Standing order extension
		if idx >= len(parts) {
			return DataModel{}, fmt.Errorf("missing standing order extension field")
		}
		standingOrderExt := parts[idx]
		idx++

		if standingOrderExt == "1" {
			if idx+4 > len(parts) {
				return DataModel{}, fmt.Errorf("insufficient standing order fields")
			}

			day, _ := bysquare.ParseNumber(parts[idx])
			idx++
			month, _ := bysquare.ParseNumber(parts[idx])
			idx++
			periodicity := parts[idx]
			idx++
			lastDate := parts[idx]
			idx++

			if payment.Type == PaymentTypeStandingOrder {
				payment.StandingOrderExt = &StandingOrder{
					Day:         uint8(day),
					Month:       uint16(month),
					Periodicity: Periodicity(periodicity),
					LastDate:    lastDate,
				}
			}
		}

		// Direct debit extension
		if idx >= len(parts) {
			return DataModel{}, fmt.Errorf("missing direct debit extension field")
		}
		directDebitExt := parts[idx]
		idx++

		if directDebitExt == "1" {
			if idx+10 > len(parts) {
				return DataModel{}, fmt.Errorf("insufficient direct debit fields")
			}

			scheme, _ := bysquare.ParseNumber(parts[idx])
			idx++
			ddType, _ := bysquare.ParseNumber(parts[idx])
			idx++
			varSymbol := parts[idx]
			idx++
			specSymbol := parts[idx]
			idx++
			origRefInfo := parts[idx]
			idx++
			mandateID := parts[idx]
			idx++
			creditorID := parts[idx]
			idx++
			contractID := parts[idx]
			idx++
			maxAmount, _ := bysquare.ParseFloat(parts[idx])
			idx++
			validTillDate := parts[idx]
			idx++

			if payment.Type == PaymentTypeDirectDebit {
				payment.DirectDebitExt = &DirectDebit{
					DirectDebitScheme:        uint8(scheme),
					DirectDebitType:          uint8(ddType),
					VariableSymbol:           varSymbol,
					SpecificSymbol:           specSymbol,
					OriginatorsReferenceInfo: origRefInfo,
					MandateID:                mandateID,
					CreditorID:               creditorID,
					ContractID:               contractID,
					MaxAmount:                maxAmount,
					ValidTillDate:            validTillDate,
				}
			}
		}

		model.Payments = append(model.Payments, payment)
	}

	// Parse beneficiary blocks (one per payment)
	for i := 0; i < paymentsCount; i++ {
		if idx+3 > len(parts) {
			model.Payments[i].Beneficiary = &Beneficiary{
				Name:   "",
				Street: "",
				City:   "",
			}
			continue
		}

		name := parts[idx]
		idx++
		street := parts[idx]
		idx++
		city := parts[idx]
		idx++

		model.Payments[i].Beneficiary = &Beneficiary{
			Name:   name,
			Street: street,
			City:   city,
		}
	}

	return model, nil
}

package bysquare

import (
	"encoding/binary"
	"fmt"
	"strconv"
	"strings"
)

// Decode parses a BySquare QR string back to DataModel.
//
// The decoding process:
// 1. Base32Hex decoding
// 2. Header parsing
// 3. LZMA decompression
// 4. CRC32 verification
// 5. Deserialization from tab-separated format
func Decode(qr string) (DataModel, error) {
	// Decode Base32Hex
	bytes, err := decodeBase32Hex(qr, true)
	if err != nil {
		return DataModel{}, fmt.Errorf("base32hex decode failed: %w", err)
	}

	if len(bytes) < 4 {
		return DataModel{}, fmt.Errorf("invalid data: too short")
	}

	// Parse header (first 2 bytes)
	headerBytes := bytes[0:2]
	header := parseBysquareHeader(headerBytes)

	// Validate version
	if header.Version > uint8(Version120) {
		return DataModel{}, fmt.Errorf("unsupported version: %d", header.Version)
	}

	// Parse payload length (bytes 2-3)
	payloadLengthBytes := bytes[2:4]
	payloadLength := binary.LittleEndian.Uint16(payloadLengthBytes)

	// Extract compressed data (skip 4-byte header)
	compressed := bytes[4:]

	// Decompress LZMA
	decompressed, err := decompressLZMA(compressed, int(payloadLength))
	if err != nil {
		return DataModel{}, fmt.Errorf("LZMA decompression failed: %w", err)
	}

	if len(decompressed) < 4 {
		return DataModel{}, fmt.Errorf("decompressed data too short")
	}

	// Extract and verify CRC32 checksum
	checksumBytes := decompressed[0:4]
	expectedChecksum := binary.LittleEndian.Uint32(checksumBytes)

	// Extract payload
	payload := decompressed[4:]
	payloadStr := string(payload)

	// Verify checksum
	actualChecksum := crc32Checksum(payloadStr)
	if actualChecksum != expectedChecksum {
		return DataModel{}, fmt.Errorf("CRC32 checksum mismatch")
	}

	// Deserialize tab-separated data
	model, err := deserialize(payloadStr)
	if err != nil {
		return DataModel{}, fmt.Errorf("deserialization failed: %w", err)
	}

	return model, nil
}

// BysquareHeader represents parsed header fields.
type BysquareHeader struct {
	BySquareType uint8
	Version      uint8
	DocumentType uint8
	Reserved     uint8
}

// parseBysquareHeader extracts header fields from 2 bytes.
func parseBysquareHeader(header []byte) BysquareHeader {
	if len(header) < 2 {
		panic("header must be 2 bytes")
	}

	return BysquareHeader{
		BySquareType: (header[0] >> 4) & 0x0F,
		Version:      header[0] & 0x0F,
		DocumentType: (header[1] >> 4) & 0x0F,
		Reserved:     header[1] & 0x0F,
	}
}

// deserialize parses tab-separated format to DataModel.
func deserialize(data string) (DataModel, error) {
	parts := strings.Split(data, "\t")
	idx := 0

	if len(parts) < 2 {
		return DataModel{}, fmt.Errorf("insufficient data fields")
	}

	// Base fields
	invoiceID := parts[idx]
	idx++

	paymentsCount, err := parseNumber(parts[idx])
	if err != nil {
		return DataModel{}, fmt.Errorf("invalid payments count: %w", err)
	}
	idx++

	model := DataModel{
		InvoiceID: invoiceID,
		Payments:  make([]SimplePayment, 0, paymentsCount),
	}

	// Parse payments
	for i := 0; i < paymentsCount; i++ {
		if idx+9 > len(parts) {
			return DataModel{}, fmt.Errorf("insufficient payment fields")
		}

		paymentType, _ := parseNumber(parts[idx])
		idx++
		amount, _ := parseFloat(parts[idx])
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

		// Parse bank accounts
		accountsCount, _ := parseNumber(parts[idx])
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

		if standingOrderExt == "1" && payment.Type == PaymentTypeStandingOrder {
			if idx+4 > len(parts) {
				return DataModel{}, fmt.Errorf("insufficient standing order fields")
			}

			day, _ := parseNumber(parts[idx])
			idx++
			month, _ := parseNumber(parts[idx])
			idx++
			periodicity := parts[idx]
			idx++
			lastDate := parts[idx]
			idx++

			payment.StandingOrderExt = &StandingOrder{
				Day:         uint8(day),
				Month:       uint16(month),
				Periodicity: Periodicity(periodicity),
				LastDate:    lastDate,
			}
		}

		// Direct debit extension
		if idx >= len(parts) {
			return DataModel{}, fmt.Errorf("missing direct debit extension field")
		}
		directDebitExt := parts[idx]
		idx++

		if directDebitExt == "1" && payment.Type == PaymentTypeDirectDebit {
			if idx+10 > len(parts) {
				return DataModel{}, fmt.Errorf("insufficient direct debit fields")
			}

			scheme, _ := parseNumber(parts[idx])
			idx++
			ddType, _ := parseNumber(parts[idx])
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
			maxAmount, _ := parseFloat(parts[idx])
			idx++
			validTillDate := parts[idx]
			idx++

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

		model.Payments = append(model.Payments, payment)
	}

	// Parse beneficiary blocks (one per payment)
	for i := 0; i < paymentsCount; i++ {
		if idx+3 > len(parts) {
			// Beneficiary fields might be missing in older versions
			// Create empty beneficiary for v1.2.0 compliance
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

// parseNumber parses a string to int, returning 0 if empty or invalid.
func parseNumber(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	return strconv.Atoi(s)
}

// parseFloat parses a string to float64, returning 0 if empty or invalid.
func parseFloat(s string) (float64, error) {
	if s == "" {
		return 0, nil
	}
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

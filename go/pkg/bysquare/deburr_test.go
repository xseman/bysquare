package bysquare_test

import (
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// TestDeburrBasicDiacritics tests basic diacritic removal
func TestDeburrBasicDiacritics(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"áéíóú", "aeiou"},
		{"ÁÉÍÓÚ", "AEIOU"},
		{"čďěňřšťž", "cdenrstz"},
		{"ČĎĚŇŘŠŤŽ", "CDENRSTZ"},
		{"ľĺôŕ", "llor"},
		{"ĽĹÔŔ", "LLOR"},
		{"ůýÿ", "uyy"},
		{"ŮÝŸ", "UYY"},
		{"Ján Nováček", "Jan Novacek"},
		{"Žilina", "Zilina"},
		{"Úzká ulica", "Uzka ulica"},
		// New mappings added in this update
		{"\u0132ssel", "IJssel"},     // U+0132 (IJ ligature) → IJ
		{"\u0133muiden", "ijmuiden"}, // U+0133 (ij ligature) → ij
		{"\u0152uvre", "Oeuvre"},     // U+0152 (Œ ligature) → Oe
		{"c\u0153ur", "coeur"},       // U+0153 (œ ligature) → oe
		{"\u0149 dag", "'n dag"},     // U+0149 (ʼn) → 'n
		{"\u017ftadt", "sstadt"},     // U+017F (long s) → ss, then 's' + 'tadt' = "sstadt"
	}

	for _, tc := range testCases {
		t.Run(tc.input, func(t *testing.T) {
			model := bysquare.DataModel{
				Payments: []bysquare.SimplePayment{
					{
						Type:         1,
						Amount:       100,
						CurrencyCode: "EUR",
						PaymentNote:  tc.input,
						BankAccounts: []bysquare.BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			}

			qr, err := bysquare.Encode(model, bysquare.EncodeOptions{Deburr: true})
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			decoded, err := bysquare.Decode(qr)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}

			if decoded.Payments[0].PaymentNote != tc.expected {
				t.Errorf("Expected '%s', got '%s'", tc.expected, decoded.Payments[0].PaymentNote)
			}
		})
	}
}

// TestDeburrPreservesNonDiacritics tests that non-diacritical characters are preserved
func TestDeburrPreservesNonDiacritics(t *testing.T) {
	testCases := []string{
		"abc123",
		"ABC-DEF",
		"test@email.com",
		"100.50 EUR",
		"SK9611000000002918599669",
	}

	for _, tc := range testCases {
		t.Run(tc, func(t *testing.T) {
			model := bysquare.DataModel{
				Payments: []bysquare.SimplePayment{
					{
						Type:         1,
						Amount:       100,
						CurrencyCode: "EUR",
						PaymentNote:  tc,
						BankAccounts: []bysquare.BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			}

			qr, err := bysquare.Encode(model, bysquare.EncodeOptions{Deburr: true})
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			decoded, err := bysquare.Decode(qr)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}

			if decoded.Payments[0].PaymentNote != tc {
				t.Errorf("Expected '%s', got '%s'", tc, decoded.Payments[0].PaymentNote)
			}
		})
	}
}

// TestDeburrOnlySpecificFields tests that deburr only affects specific fields
func TestDeburrOnlySpecificFields(t *testing.T) {
	model := bysquare.DataModel{
		InvoiceID: "ČĎ-2024-ŽÁ", // Should NOT be deburred
		Payments: []bysquare.SimplePayment{
			{
				Type:           1,
				Amount:         100,
				CurrencyCode:   "EUR",
				VariableSymbol: "ČĎ123",         // Should NOT be deburred
				PaymentNote:    "Platba č. 123", // SHOULD be deburred
				BankAccounts: []bysquare.BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
				Beneficiary: &bysquare.Beneficiary{
					Name:   "Ján Nováček", // SHOULD be deburred
					Street: "Úzká 5",      // SHOULD be deburred
					City:   "Žilina",      // SHOULD be deburred
				},
			},
		},
	}

	qr, err := bysquare.Encode(model, bysquare.EncodeOptions{Deburr: true})
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := bysquare.Decode(qr)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	// InvoiceID should keep diacritics
	if decoded.InvoiceID != "ČĎ-2024-ŽÁ" {
		t.Errorf("InvoiceID should preserve diacritics, got '%s'", decoded.InvoiceID)
	}

	payment := decoded.Payments[0]

	// VariableSymbol should keep diacritics
	if payment.VariableSymbol != "ČĎ123" {
		t.Errorf("VariableSymbol should preserve diacritics, got '%s'", payment.VariableSymbol)
	}

	// PaymentNote should be deburred
	if payment.PaymentNote != "Platba c. 123" {
		t.Errorf("PaymentNote should be deburred, got '%s'", payment.PaymentNote)
	}

	// Beneficiary fields should be deburred
	if payment.Beneficiary.Name != "Jan Novacek" {
		t.Errorf("Beneficiary name should be deburred, got '%s'", payment.Beneficiary.Name)
	}

	if payment.Beneficiary.Street != "Uzka 5" {
		t.Errorf("Beneficiary street should be deburred, got '%s'", payment.Beneficiary.Street)
	}

	if payment.Beneficiary.City != "Zilina" {
		t.Errorf("Beneficiary city should be deburred, got '%s'", payment.Beneficiary.City)
	}
}

// TestDeburrWithoutFlag tests that diacritics are preserved when deburr is disabled
func TestDeburrWithoutFlag(t *testing.T) {
	original := "Ján Nováček - Žilina"

	model := bysquare.DataModel{
		Payments: []bysquare.SimplePayment{
			{
				Type:         1,
				Amount:       100,
				CurrencyCode: "EUR",
				PaymentNote:  original,
				BankAccounts: []bysquare.BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
			},
		},
	}

	// Encode WITHOUT deburr
	qr, err := bysquare.Encode(model, bysquare.EncodeOptions{Deburr: false})
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := bysquare.Decode(qr)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	// Should preserve diacritics
	if decoded.Payments[0].PaymentNote != original {
		t.Errorf("Expected '%s', got '%s'", original, decoded.Payments[0].PaymentNote)
	}
}

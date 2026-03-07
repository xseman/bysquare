package pay

import (
	"strings"
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

func TestSerialize(t *testing.T) {
	tests := []struct {
		name     string
		model    DataModel
		contains []string
	}{
		{
			name: "payment order",
			model: DataModel{
				InvoiceID: "inv-1",
				Payments: []SimplePayment{{
					Type:           PaymentTypePaymentOrder,
					Amount:         100.50,
					CurrencyCode:   CurrencyEUR,
					VariableSymbol: "123",
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			contains: []string{"inv-1", "100.5", "EUR", "123", "SK9611000000002918599669", "Test"},
		},
		{
			name: "standing order",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypeStandingOrder,
					Amount:       50,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					StandingOrderExt: &StandingOrder{
						Day:         15,
						Month:       1,
						Periodicity: PeriodicityMonthly,
						LastDate:    "20251231",
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			contains: []string{"50", "EUR", "15", "m", "20251231"},
		},
		{
			name: "direct debit",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypeDirectDebit,
					Amount:       200,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					DirectDebitExt: &DirectDebit{
						DirectDebitScheme: 1,
						DirectDebitType:   0,
						MandateID:         "MANDATE-1",
						MaxAmount:         500,
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			contains: []string{"200", "EUR", "MANDATE-1", "500"},
		},
		{
			name: "multiple bank accounts",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       10,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
						{IBAN: "CZ5508000000001234567899", BIC: "GIBACZPX"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			contains: []string{"SK9611000000002918599669", "CZ5508000000001234567899", "GIBACZPX"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := serialize(tt.model)

			for _, s := range tt.contains {
				if !strings.Contains(result, s) {
					t.Errorf("serialize() result does not contain %q\ngot: %s", s, result)
				}
			}
		})
	}
}

func TestEncode(t *testing.T) {
	tests := []struct {
		name   string
		model  DataModel
		opts   []EncodeOptions
		prefix string
	}{
		{
			name: "default options (v1.2.0)",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			prefix: "08",
		},
		{
			name: "version 1.1.0",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			opts:   []EncodeOptions{{Deburr: true, Validate: true, Version: bysquare.Version110}},
			prefix: "04",
		},
		{
			name: "version 1.0.0",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			opts:   []EncodeOptions{{Deburr: true, Validate: false, Version: bysquare.Version100}},
			prefix: "00",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Encode(tt.model, tt.opts...)
			if err != nil {
				t.Fatalf("Encode() error: %v", err)
			}

			if !strings.HasPrefix(result, tt.prefix) {
				t.Errorf("expected prefix %q, got %q", tt.prefix, result[:2])
			}

			if len(result) < 10 {
				t.Errorf("encoded string too short: %d", len(result))
			}
		})
	}
}

func TestEncodeDeburr(t *testing.T) {
	makeModel := func() DataModel {
		return DataModel{
			Payments: []SimplePayment{{
				Type:         PaymentTypePaymentOrder,
				Amount:       100,
				CurrencyCode: CurrencyEUR,
				PaymentNote:  "Platba za služby",
				BankAccounts: []BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
				Beneficiary: &Beneficiary{Name: "Ján Nováček"},
			}},
		}
	}

	withDeburr, err := Encode(makeModel(), EncodeOptions{Deburr: true, Validate: true, Version: bysquare.Version120})
	if err != nil {
		t.Fatalf("Encode with deburr failed: %v", err)
	}

	withoutDeburr, err := Encode(makeModel(), EncodeOptions{Deburr: false, Validate: true, Version: bysquare.Version120})
	if err != nil {
		t.Fatalf("Encode without deburr failed: %v", err)
	}

	if withDeburr == withoutDeburr {
		t.Error("expected different output with/without deburr for diacritics input")
	}
}

func TestEncodeValidationError(t *testing.T) {
	model := DataModel{
		Payments: []SimplePayment{{
			Type:         PaymentTypePaymentOrder,
			Amount:       100,
			CurrencyCode: CurrencyEUR,
			BankAccounts: []BankAccount{
				{IBAN: "INVALID"},
			},
			Beneficiary: &Beneficiary{Name: "Test"},
		}},
	}

	_, err := Encode(model)
	if err == nil {
		t.Error("expected validation error for invalid IBAN")
	}
}

func TestEncodeNoPayments(t *testing.T) {
	model := DataModel{
		Payments: []SimplePayment{},
	}

	_, err := Encode(model)
	if err == nil {
		t.Error("expected error for empty payments")
	}
}

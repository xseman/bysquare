package pay

import (
	"testing"
)

func TestDecodeSimplePayment(t *testing.T) {
	qr := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	model, err := Decode(qr)
	if err != nil {
		t.Fatalf("Decode() error: %v", err)
	}

	if model.InvoiceID != "random-id" {
		t.Errorf("expected InvoiceID 'random-id', got %q", model.InvoiceID)
	}

	if len(model.Payments) != 1 {
		t.Fatalf("expected 1 payment, got %d", len(model.Payments))
	}

	payment := model.Payments[0]
	if payment.Amount != 100 {
		t.Errorf("expected Amount 100, got %v", payment.Amount)
	}

	if payment.VariableSymbol != "123" {
		t.Errorf("expected VariableSymbol '123', got %q", payment.VariableSymbol)
	}

	if len(payment.BankAccounts) != 1 {
		t.Fatalf("expected 1 bank account, got %d", len(payment.BankAccounts))
	}

	if payment.BankAccounts[0].IBAN != "SK9611000000002918599669" {
		t.Errorf("expected IBAN 'SK9611000000002918599669', got %q", payment.BankAccounts[0].IBAN)
	}
}

func TestDecodeInvalidInput(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"empty string", ""},
		{"too short", "00"},
		{"invalid base32hex", "!!!INVALID!!!"},
		{"garbage data", "ZZZZZZZZZZZZZZZZZZZZ"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(tt.input)
			if err == nil {
				t.Errorf("expected error for input %q", tt.input)
			}
		})
	}
}

func TestRoundTrip(t *testing.T) {
	tests := []struct {
		name  string
		model DataModel
	}{
		{
			name: "payment order",
			model: DataModel{
				InvoiceID: "test-roundtrip",
				Payments: []SimplePayment{{
					Type:           PaymentTypePaymentOrder,
					Amount:         123.45,
					CurrencyCode:   CurrencyEUR,
					VariableSymbol: "456789",
					PaymentNote:    "Test payment",
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{
						Name:   "Test Beneficiary",
						Street: "Main Street 1",
						City:   "Bratislava",
					},
				}},
			},
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
						CreditorID:        "CRED-1",
						MaxAmount:         500,
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
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
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded, err := Encode(tt.model)
			if err != nil {
				t.Fatalf("Encode() error: %v", err)
			}

			decoded, err := Decode(encoded)
			if err != nil {
				t.Fatalf("Decode() error: %v", err)
			}

			if decoded.InvoiceID != tt.model.InvoiceID {
				t.Errorf("InvoiceID: got %q, want %q", decoded.InvoiceID, tt.model.InvoiceID)
			}

			if len(decoded.Payments) != len(tt.model.Payments) {
				t.Fatalf("Payments count: got %d, want %d", len(decoded.Payments), len(tt.model.Payments))
			}

			for i := range tt.model.Payments {
				got := decoded.Payments[i]
				want := tt.model.Payments[i]

				if got.Type != want.Type {
					t.Errorf("payment[%d].Type: got %d, want %d", i, got.Type, want.Type)
				}
				if got.Amount != want.Amount {
					t.Errorf("payment[%d].Amount: got %v, want %v", i, got.Amount, want.Amount)
				}
				if got.CurrencyCode != want.CurrencyCode {
					t.Errorf("payment[%d].CurrencyCode: got %q, want %q", i, got.CurrencyCode, want.CurrencyCode)
				}
				if len(got.BankAccounts) != len(want.BankAccounts) {
					t.Errorf("payment[%d].BankAccounts count: got %d, want %d", i, len(got.BankAccounts), len(want.BankAccounts))
				}
			}
		})
	}
}

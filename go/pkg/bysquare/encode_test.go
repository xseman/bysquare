package bysquare

import (
	"testing"
)

// TestSerialize tests the serialize function with various data models.
func TestSerialize(t *testing.T) {
	tests := []struct {
		name     string
		input    DataModel
		expected string
	}{
		{
			name: "Simple payment order",
			input: DataModel{
				InvoiceID: "random-id",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         100.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			},
			expected: "random-id\t1\t1\t100\tEUR\t\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t0\t0\t\t\t",
		},
		{
			name: "Payment with all symbols",
			input: DataModel{
				InvoiceID: "test-001",
				Payments: []SimplePayment{
					{
						Type:                            PaymentTypePaymentOrder,
						Amount:                          250.50,
						CurrencyCode:                    CurrencyEUR,
						VariableSymbol:                  "123",
						ConstantSymbol:                  "456",
						SpecificSymbol:                  "789",
						OriginatorsReferenceInformation: "Payment note",
						PaymentNote:                     "Invoice payment",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			},
			expected: "test-001\t1\t1\t250.5\tEUR\t\t123\t456\t789\tPayment note\tInvoice payment\t1\tSK9611000000002918599669\t\t0\t0\t\t\t",
		},
		{
			name: "Payment with multiple bank accounts",
			input: DataModel{
				InvoiceID: "multi-bank",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         1000.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
							{IBAN: "SK5681800000007000157042"},
						},
					},
				},
			},
			expected: "multi-bank\t1\t1\t1000\tEUR\t\t123\t\t\t\t\t2\tSK9611000000002918599669\t\tSK5681800000007000157042\t\t0\t0\t\t\t",
		},
		{
			name: "Payment with due date",
			input: DataModel{
				InvoiceID: "due-date-test",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         500.0,
						CurrencyCode:   CurrencyEUR,
						PaymentDueDate: "2024-12-31",
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			},
			expected: "due-date-test\t1\t1\t500\tEUR\t20241231\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t0\t0\t\t\t",
		},
		{
			name: "Standing order payment",
			input: DataModel{
				InvoiceID: "standing-order",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypeStandingOrder,
						Amount:         100.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						StandingOrderExt: &StandingOrder{
							Day:         15,
							Month:       uint16(MonthJanuary),
							Periodicity: PeriodicityMonthly,
						},
					},
				},
			},
			expected: "standing-order\t1\t2\t100\tEUR\t\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t1\t15\t1\tm\t\t0\t\t\t",
		},
		{
			name: "Direct debit payment",
			input: DataModel{
				InvoiceID: "direct-debit",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypeDirectDebit,
						Amount:         75.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						DirectDebitExt: &DirectDebit{
							DirectDebitScheme: 1,
							DirectDebitType:   1,
						},
					},
				},
			},
			expected: "direct-debit\t1\t3\t75\tEUR\t\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t0\t1\t1\t1\t\t\t\t\t\t\t\t\t\t\t",
		},
		{
			name: "Payment with beneficiary",
			input: DataModel{
				InvoiceID: "with-beneficiary",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         200.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: &Beneficiary{
							Name:   "John Doe",
							Street: "Main Street 1",
							City:   "Bratislava",
						},
					},
				},
			},
			expected: "with-beneficiary\t1\t1\t200\tEUR\t\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t0\t0\tJohn Doe\tMain Street 1\tBratislava",
		},
		{
			name: "Multiple payments",
			input: DataModel{
				InvoiceID: "multi-payment",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         100.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         200.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "456",
						BankAccounts: []BankAccount{
							{IBAN: "SK5681800000007000157042"},
						},
					},
				},
			},
			expected: "multi-payment\t2\t1\t100\tEUR\t\t123\t\t\t\t\t1\tSK9611000000002918599669\t\t0\t0\t1\t200\tEUR\t\t456\t\t\t\t\t1\tSK5681800000007000157042\t\t0\t0\t\t\t\t\t\t",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := serialize(tt.input)
			if result != tt.expected {
				t.Errorf("serialize() = %q, expected %q", result, tt.expected)
			}
		})
	}
}

// TestEncode tests the full encode function.
func TestEncode(t *testing.T) {
	testCases := []struct {
		name      string
		input     *DataModel
		wantError bool
	}{
		{
			name: "Valid simple payment",
			input: &DataModel{
				InvoiceID: "test-001",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         100.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
					},
				},
			},
			wantError: false,
		},
		{
			name: "Invalid IBAN",
			input: &DataModel{
				InvoiceID: "invalid-iban",
				Payments: []SimplePayment{
					{
						Type:           PaymentTypePaymentOrder,
						Amount:         100.0,
						CurrencyCode:   CurrencyEUR,
						VariableSymbol: "123",
						BankAccounts: []BankAccount{
							{IBAN: "INVALID"},
						},
					},
				},
			},
			wantError: true,
		},
		{
			name: "Empty payments",
			input: &DataModel{
				InvoiceID: "empty",
				Payments:  []SimplePayment{},
			},
			wantError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := Encode(*tc.input)
			if tc.wantError {
				if err == nil {
					t.Error("Encode() expected error, got nil")
				}
			} else {
				if err != nil {
					t.Errorf("Encode() unexpected error: %v", err)
				}
				if result == "" {
					t.Error("Encode() returned empty string")
				}
				// Basic format validation
				if len(result) < 10 {
					t.Errorf("Encode() result too short: %s", result)
				}
			}
		})
	}
}

// TestSerializeDate tests date serialization.
func TestSerializeDate(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"2024-12-31", "20241231"},
		{"2024-01-01", "20240101"},
		{"2023-06-15", "20230615"},
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := serializeDate(tt.input)
			if result != tt.expected {
				t.Errorf("serializeDate(%q) = %q, expected %q", tt.input, result, tt.expected)
			}
		})
	}
}

// TestFormatFloat tests float formatting.
func TestFormatFloat(t *testing.T) {
	tests := []struct {
		input    float64
		expected string
	}{
		{100.0, "100"},
		{100.5, "100.5"},
		{0.01, "0.01"},
		{1234.56, "1234.56"},
		{0.0, ""}, // Zero amounts are omitted
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := formatFloat(tt.input)
			if result != tt.expected {
				t.Errorf("formatFloat(%f) = %q, expected %q", tt.input, result, tt.expected)
			}
		})
	}
}

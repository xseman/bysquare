package pay

import (
	"errors"
	"math"
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

func TestValidateDataModel(t *testing.T) {
	tests := []struct {
		name    string
		model   DataModel
		version bysquare.Version
		wantErr bool
	}{
		{
			name: "valid payment",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:       100,
						CurrencyCode: CurrencyEUR,
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: Beneficiary{Name: "Test"},
					},
				}},
			},
			version: bysquare.Version120,
			wantErr: false,
		},
		{
			name: "invalid IBAN",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:       100,
						CurrencyCode: CurrencyEUR,
						BankAccounts: []BankAccount{
							{IBAN: "INVALID"},
						},
						Beneficiary: Beneficiary{Name: "Test"},
					},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "invalid currency code",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:       100,
						CurrencyCode: "XX",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: Beneficiary{Name: "Test"},
					},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "v1.2.0 requires beneficiary name",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:       100,
						CurrencyCode: CurrencyEUR,
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: Beneficiary{Name: ""},
					},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "v1.0.0 allows empty beneficiary name",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:       100,
						CurrencyCode: CurrencyEUR,
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: Beneficiary{Name: ""},
					},
				}},
			},
			version: bysquare.Version100,
			wantErr: false,
		},
		{
			name: "invalid payment due date format",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount:         100,
						CurrencyCode:   CurrencyEUR,
						PaymentDueDate: "2024-12-31",
						BankAccounts: []BankAccount{
							{IBAN: "SK9611000000002918599669"},
						},
						Beneficiary: Beneficiary{Name: "Test"},
					},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDataModel(tt.model, tt.version)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDataModel() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateSimplePaymentAmount(t *testing.T) {
	payment := func(paymentType PaymentOptions, amount, maxAmount float64) Payment {
		return Payment{
			Type: paymentType,
			SimplePayment: SimplePayment{
				Amount:       amount,
				CurrencyCode: CurrencyEUR,
				BankAccounts: []BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
				Beneficiary: Beneficiary{Name: "Test"},
			},
			MaxAmount: maxAmount,
		}
	}

	tests := []struct {
		name     string
		payment  Payment
		wantPath string
	}{
		{"zero amount", payment(PaymentOptionsPaymentOrder, 0, 0), ""},
		{"negative amount", payment(PaymentOptionsPaymentOrder, -100, 0), "payments[0].amount"},
		{"NaN amount", payment(PaymentOptionsPaymentOrder, math.NaN(), 0), "payments[0].amount"},
		{"infinite amount", payment(PaymentOptionsPaymentOrder, math.Inf(1), 0), "payments[0].amount"},
		{"amount longer than 15 characters", payment(PaymentOptionsPaymentOrder, 9_999_999_999_999_999, 0), "payments[0].amount"},
		{"negative maxAmount of a direct debit", payment(PaymentOptionsDirectDebit, 100, -1), "payments[0].maxAmount"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSimplePayment(tt.payment, "payments[0]", bysquare.Version120)

			if tt.wantPath == "" {
				if err != nil {
					t.Fatalf("ValidateSimplePayment() error = %v, want nil", err)
				}

				return
			}

			var validationErr *bysquare.ValidationError
			if !errors.As(err, &validationErr) {
				t.Fatalf("ValidateSimplePayment() error = %v, want a ValidationError", err)
			}
			if validationErr.Path != tt.wantPath {
				t.Errorf("Path = %q, want %q", validationErr.Path, tt.wantPath)
			}
		})
	}
}

package pay

import (
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
			version: bysquare.Version120,
			wantErr: false,
		},
		{
			name: "empty payments",
			model: DataModel{
				Payments: []SimplePayment{},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "missing bank account",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{},
					Beneficiary:  &Beneficiary{Name: "Test"},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "invalid IBAN",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "INVALID"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "invalid currency code",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: "XX",
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "v1.2.0 requires beneficiary name",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: ""},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
		{
			name: "v1.0.0 allows empty beneficiary name",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:         PaymentTypePaymentOrder,
					Amount:       100,
					CurrencyCode: CurrencyEUR,
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: ""},
				}},
			},
			version: bysquare.Version100,
			wantErr: false,
		},
		{
			name: "invalid payment due date format",
			model: DataModel{
				Payments: []SimplePayment{{
					Type:           PaymentTypePaymentOrder,
					Amount:         100,
					CurrencyCode:   CurrencyEUR,
					PaymentDueDate: "2024-12-31",
					BankAccounts: []BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
					Beneficiary: &Beneficiary{Name: "Test"},
				}},
			},
			version: bysquare.Version120,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDataModel(&tt.model, tt.version)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDataModel() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

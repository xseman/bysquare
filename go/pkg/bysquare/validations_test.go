package bysquare

import "testing"

func TestIsValidIBAN(t *testing.T) {
	testCases := []struct {
		name  string
		iban  string
		valid bool
	}{
		// Valid IBANs
		{
			name:  "valid Slovak IBAN",
			iban:  "SK3112000000198742637541",
			valid: true,
		},
		{
			name:  "valid Czech IBAN",
			iban:  "CZ6508000000192000145399",
			valid: true,
		},
		{
			name:  "valid German IBAN",
			iban:  "DE89370400440532013000",
			valid: true,
		},
		{
			name:  "valid IBAN with spaces",
			iban:  "SK31 1200 0000 1987 4263 7541",
			valid: true,
		},
		{
			name:  "valid IBAN lowercase",
			iban:  "sk3112000000198742637541",
			valid: true,
		},

		// Invalid IBANs
		{
			name:  "empty IBAN",
			iban:  "",
			valid: false,
		},
		{
			name:  "too short",
			iban:  "SK31",
			valid: false,
		},
		{
			name:  "invalid country code",
			iban:  "XX3112000000198742637541",
			valid: false,
		},
		{
			name:  "invalid checksum",
			iban:  "SK3112000000198742637542",
			valid: false,
		},
		{
			name:  "contains special characters",
			iban:  "SK31-1200-0000-1987-4263-7541",
			valid: false,
		},
		{
			name:  "starts with digits",
			iban:  "12SK3112000000198742637541",
			valid: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := isValidIBAN(tc.iban)
			if result != tc.valid {
				t.Errorf("expected %v, got %v for IBAN: %q", tc.valid, result, tc.iban)
			}
		})
	}
}

func TestIsValidBIC(t *testing.T) {
	testCases := []struct {
		name  string
		bic   string
		valid bool
	}{
		// Valid BICs
		{
			name:  "valid 8-character BIC",
			bic:   "TATRSKBX",
			valid: true,
		},
		{
			name:  "valid 11-character BIC",
			bic:   "TATRSKBXXXX",
			valid: true,
		},
		{
			name:  "valid BIC lowercase",
			bic:   "tatrskbx",
			valid: true,
		},

		// Invalid BICs
		{
			name:  "empty BIC",
			bic:   "",
			valid: false,
		},
		{
			name:  "too short",
			bic:   "TATR",
			valid: false,
		},
		{
			name:  "wrong length (9 characters)",
			bic:   "TATRSKBXX",
			valid: false,
		},
		{
			name:  "wrong length (10 characters)",
			bic:   "TATRSKBXXX",
			valid: false,
		},
		{
			name:  "contains digits in bank code",
			bic:   "TAT1SKBX",
			valid: false,
		},
		{
			name:  "contains special characters",
			bic:   "TATR-SKBX",
			valid: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := isValidBIC(tc.bic)
			if result != tc.valid {
				t.Errorf("expected %v, got %v for BIC: %q", tc.valid, result, tc.bic)
			}
		})
	}
}

func TestIsValidCurrencyCode(t *testing.T) {
	testCases := []struct {
		name     string
		currency string
		valid    bool
	}{
		// Valid currency codes
		{
			name:     "EUR",
			currency: "EUR",
			valid:    true,
		},
		{
			name:     "USD",
			currency: "USD",
			valid:    true,
		},
		{
			name:     "CZK",
			currency: "CZK",
			valid:    true,
		},
		{
			name:     "XXX (no currency)",
			currency: "XXX",
			valid:    true,
		},

		// Invalid currency codes
		{
			name:     "empty",
			currency: "",
			valid:    false,
		},
		{
			name:     "too short",
			currency: "EU",
			valid:    false,
		},
		{
			name:     "too long",
			currency: "EURO",
			valid:    false,
		},
		{
			name:     "lowercase",
			currency: "eur",
			valid:    false,
		},
		{
			name:     "mixed case",
			currency: "Eur",
			valid:    false,
		},
		{
			name:     "contains digits",
			currency: "EU1",
			valid:    false,
		},
		{
			name:     "contains special characters",
			currency: "EU-",
			valid:    false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := isValidCurrencyCode(tc.currency)
			if result != tc.valid {
				t.Errorf("expected %v, got %v for currency: %q", tc.valid, result, tc.currency)
			}
		})
	}
}

func TestIsValidDate(t *testing.T) {
	testCases := []struct {
		name  string
		date  string
		valid bool
	}{
		// Valid dates
		{
			name:  "standard date",
			date:  "20231231",
			valid: true,
		},
		{
			name:  "leap year date",
			date:  "20240229",
			valid: true,
		},
		{
			name:  "first day of year",
			date:  "20230101",
			valid: true,
		},

		// Invalid dates
		{
			name:  "empty",
			date:  "",
			valid: false,
		},
		{
			name:  "wrong format YYYY-MM-DD",
			date:  "2023-12-31",
			valid: false,
		},
		{
			name:  "wrong format DD-MM-YYYY",
			date:  "31-12-2023",
			valid: false,
		},
		{
			name:  "wrong format MM/DD/YYYY",
			date:  "12/31/2023",
			valid: false,
		},
		{
			name:  "too short",
			date:  "2023-1-1",
			valid: false,
		},
		{
			name:  "month too large",
			date:  "20231301",
			valid: false,
		},
		{
			name:  "day too large",
			date:  "20231232",
			valid: false,
		},
		{
			name:  "month zero",
			date:  "20230001",
			valid: false,
		},
		{
			name:  "day zero",
			date:  "20231200",
			valid: false,
		},
		{
			name:  "invalid leap year Feb 29",
			date:  "20230229",
			valid: false,
		},
		{
			name:  "Feb 30 (invalid)",
			date:  "20240230",
			valid: false,
		},
		{
			name:  "April 31 (invalid)",
			date:  "20240431",
			valid: false,
		},
		{
			name:  "June 31 (invalid)",
			date:  "20240631",
			valid: false,
		},
		{
			name:  "September 31 (invalid)",
			date:  "20240931",
			valid: false,
		},
		{
			name:  "November 31 (invalid)",
			date:  "20241131",
			valid: false,
		},
		{
			name:  "valid Feb 28 non-leap year",
			date:  "20230228",
			valid: true,
		},
		{
			name:  "valid April 30",
			date:  "20240430",
			valid: true,
		},
		{
			name:  "valid May 31",
			date:  "20240531",
			valid: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := isValidDate(tc.date)
			if result != tc.valid {
				t.Errorf("expected %v, got %v for date: %q", tc.valid, result, tc.date)
			}
		})
	}
}

func TestValidateBankAccount(t *testing.T) {
	testCases := []struct {
		name      string
		account   BankAccount
		shouldErr bool
	}{
		{
			name: "valid account with IBAN only",
			account: BankAccount{
				IBAN: "SK3112000000198742637541",
			},
			shouldErr: false,
		},
		{
			name: "valid account with IBAN and BIC",
			account: BankAccount{
				IBAN: "SK3112000000198742637541",
				BIC:  "TATRSKBX",
			},
			shouldErr: false,
		},
		{
			name: "invalid IBAN",
			account: BankAccount{
				IBAN: "INVALID",
			},
			shouldErr: true,
		},
		{
			name: "invalid BIC",
			account: BankAccount{
				IBAN: "SK3112000000198742637541",
				BIC:  "INVALID",
			},
			shouldErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateBankAccount(&tc.account, "test")
			if tc.shouldErr && err == nil {
				t.Error("expected error, got nil")
			}
			if !tc.shouldErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidateSimplePayment(t *testing.T) {
	validPayment := SimplePayment{
		Type:           PaymentTypePaymentOrder,
		Amount:         100.00,
		CurrencyCode:   CurrencyEUR,
		PaymentDueDate: "20231231",
		Beneficiary:    &Beneficiary{Name: "John Doe"},
		BankAccounts: []BankAccount{
			{IBAN: "SK3112000000198742637541"},
		},
	}

	testCases := []struct {
		name      string
		payment   SimplePayment
		shouldErr bool
	}{
		{
			name:      "valid payment",
			payment:   validPayment,
			shouldErr: false,
		},
		{
			name: "no bank accounts",
			payment: SimplePayment{
				Type:           PaymentTypePaymentOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20231231",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts:   []BankAccount{},
			},
			shouldErr: true,
		},
		{
			name: "invalid currency",
			payment: SimplePayment{
				Type:           PaymentTypePaymentOrder,
				Amount:         100.00,
				CurrencyCode:   "invalid",
				PaymentDueDate: "20231231",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
			},
			shouldErr: true,
		},
		{
			name: "invalid date format",
			payment: SimplePayment{
				Type:           PaymentTypePaymentOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "31-12-2023",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
			},
			shouldErr: true,
		},
		{
			name: "missing beneficiary name",
			payment: SimplePayment{
				Type:           PaymentTypePaymentOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20231231",
				Beneficiary:    nil,
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
			},
			shouldErr: true,
		},
		{
			name: "empty beneficiary name",
			payment: SimplePayment{
				Type:           PaymentTypePaymentOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20231231",
				Beneficiary:    &Beneficiary{Name: ""},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
			},
			shouldErr: true,
		},
		{
			name: "standing order with valid lastDate",
			payment: SimplePayment{
				Type:           PaymentTypeStandingOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20240101",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
				StandingOrderExt: &StandingOrder{
					Day:         1,
					Periodicity: PeriodicityMonthly,
					LastDate:    "20241231",
				},
			},
			shouldErr: false,
		},
		{
			name: "standing order with invalid lastDate format",
			payment: SimplePayment{
				Type:           PaymentTypeStandingOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20240101",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
				StandingOrderExt: &StandingOrder{
					Day:         1,
					Periodicity: PeriodicityMonthly,
					LastDate:    "2024-12-31",
				},
			},
			shouldErr: true,
		},
		{
			name: "standing order with invalid lastDate (Feb 30)",
			payment: SimplePayment{
				Type:           PaymentTypeStandingOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20240101",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
				StandingOrderExt: &StandingOrder{
					Day:         1,
					Periodicity: PeriodicityMonthly,
					LastDate:    "20240230",
				},
			},
			shouldErr: true,
		},
		{
			name: "standing order with empty lastDate",
			payment: SimplePayment{
				Type:           PaymentTypeStandingOrder,
				Amount:         100.00,
				CurrencyCode:   CurrencyEUR,
				PaymentDueDate: "20240101",
				Beneficiary:    &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
				StandingOrderExt: &StandingOrder{
					Day:         1,
					Periodicity: PeriodicityMonthly,
					LastDate:    "",
				},
			},
			shouldErr: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateSimplePayment(&tc.payment, "test")
			if tc.shouldErr && err == nil {
				t.Error("expected error, got nil")
			}
			if !tc.shouldErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidateDataModel(t *testing.T) {
	validModel := DataModel{
		InvoiceID: "123",
		Payments: []SimplePayment{
			{
				Type:         PaymentTypePaymentOrder,
				Amount:       100.00,
				CurrencyCode: CurrencyEUR,
				Beneficiary:  &Beneficiary{Name: "John Doe"},
				BankAccounts: []BankAccount{
					{IBAN: "SK3112000000198742637541"},
				},
			},
		},
	}

	testCases := []struct {
		name      string
		model     DataModel
		shouldErr bool
	}{
		{
			name:      "valid model",
			model:     validModel,
			shouldErr: false,
		},
		{
			name: "no payments",
			model: DataModel{
				InvoiceID: "123",
				Payments:  []SimplePayment{},
			},
			shouldErr: true,
		},
		{
			name: "invalid payment",
			model: DataModel{
				InvoiceID: "123",
				Payments: []SimplePayment{
					{
						Type:         PaymentTypePaymentOrder,
						Amount:       100.00,
						CurrencyCode: "INVALID",
						Beneficiary:  &Beneficiary{Name: "John Doe"},
						BankAccounts: []BankAccount{
							{IBAN: "SK3112000000198742637541"},
						},
					},
				},
			},
			shouldErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateDataModel(&tc.model)
			if tc.shouldErr && err == nil {
				t.Error("expected error, got nil")
			}
			if !tc.shouldErr && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestValidationErrorPath(t *testing.T) {
	payment := SimplePayment{
		Type:         PaymentTypePaymentOrder,
		Amount:       100.00,
		CurrencyCode: "INVALID",
		Beneficiary:  &Beneficiary{Name: "John Doe"},
		BankAccounts: []BankAccount{
			{IBAN: "SK3112000000198742637541"},
		},
	}

	err := validateSimplePayment(&payment, "payments[0]")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	valErr, ok := err.(*ValidationError)
	if !ok {
		t.Fatalf("expected ValidationError, got %T", err)
	}

	if valErr.Path != "payments[0].currencyCode" {
		t.Errorf("expected path 'payments[0].currencyCode', got %q", valErr.Path)
	}
}

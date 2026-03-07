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
			result := IsValidIBAN(tc.iban)
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
			result := IsValidBIC(tc.bic)
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
			result := IsValidCurrencyCode(tc.currency)
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
			result := IsValidDate(tc.date)
			if result != tc.valid {
				t.Errorf("expected %v, got %v for date: %q", tc.valid, result, tc.date)
			}
		})
	}
}

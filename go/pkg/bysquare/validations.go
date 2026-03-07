package bysquare

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

var (
	// IBAN regex: 2 letters + 2 digits + up to 30 alphanumeric
	ibanRegex = regexp.MustCompile(`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`)

	// BIC regex: 4 letters + 2 letters + 2 alphanumeric + optional 3 alphanumeric
	bicRegex = regexp.MustCompile(`^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$`)

	// YYYYMMDD date regex per v1.2 specification
	dateRegex = regexp.MustCompile(`^\d{8}$`)
)

// IsValidIBAN checks if IBAN is valid using MOD-97 algorithm.
func IsValidIBAN(iban string) bool {
	// Remove spaces and convert to uppercase
	iban = strings.ReplaceAll(strings.ToUpper(iban), " ", "")

	// Check format
	if !ibanRegex.MatchString(iban) {
		return false
	}

	// MOD-97 validation
	// Move first 4 characters to end
	rearranged := iban[4:] + iban[0:4]

	// Convert letters to numbers (A=10, B=11, ..., Z=35)
	var numeric strings.Builder
	for _, ch := range rearranged {
		if ch >= 'A' && ch <= 'Z' {
			numeric.WriteString(fmt.Sprintf("%d", int(ch)-'A'+10))
		} else {
			numeric.WriteByte(byte(ch))
		}
	}

	// Calculate mod 97
	numStr := numeric.String()
	remainder := 0
	for _, digit := range numStr {
		remainder = (remainder*10 + int(digit-'0')) % 97
	}

	return remainder == 1
}

// IsValidBIC checks if BIC is valid.
func IsValidBIC(bic string) bool {
	bic = strings.ToUpper(bic)
	return bicRegex.MatchString(bic)
}

// IsValidCurrencyCode checks if currency code is valid (ISO 4217).
func IsValidCurrencyCode(code string) bool {
	if len(code) != 3 {
		return false
	}
	for _, ch := range code {
		if ch < 'A' || ch > 'Z' {
			return false
		}
	}
	return true
}

// IsValidDate checks if date is in YYYYMMDD format per v1.2 specification.
// It performs both format validation and semantic calendar validation.
func IsValidDate(date string) bool {
	if !dateRegex.MatchString(date) {
		return false
	}

	year := 0
	month := 0
	day := 0

	if _, err := fmt.Sscanf(date[0:4], "%d", &year); err != nil {
		return false
	}
	if _, err := fmt.Sscanf(date[4:6], "%d", &month); err != nil {
		return false
	}
	if _, err := fmt.Sscanf(date[6:8], "%d", &day); err != nil {
		return false
	}

	if month < 1 || month > 12 {
		return false
	}
	if day < 1 || day > 31 {
		return false
	}

	t := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	return t.Year() == year && int(t.Month()) == month && t.Day() == day
}

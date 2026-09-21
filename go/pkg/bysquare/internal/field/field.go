// Package field is what the pay and invoice serializers share about a single
// tab-separated field: cleaning it, printing and reading numbers, and the
// format checks the validations run. The TypeScript implementation keeps
// these private to each file; here one package serves both.
package field

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Sanitize replaces the field separator inside a value with a space.
//
// @see 3.8.
func Sanitize(s string) string {
	return strings.ReplaceAll(s, "\t", " ")
}

// FormatInt prints an optional integer, "" for zero.
func FormatInt(n int) string {
	if n == 0 {
		return ""
	}

	return strconv.Itoa(n)
}

// FormatFloat prints an optional number, "" for zero.
func FormatFloat(f float64) string {
	if f == 0 {
		return ""
	}

	return FormatFloatRequired(f)
}

// maxDecimals is the decimal places a number field may carry: the
// specification writes the format as #.########.
//
// @see Table 8
const maxDecimals = 8

// FormatFloatRequired prints a number that is always present, zero included,
// rounded to maxDecimals and without the trailing zeros.
func FormatFloatRequired(f float64) string {
	s := strconv.FormatFloat(f, 'f', maxDecimals, 64)
	s = strings.TrimRight(s, "0")

	return strings.TrimSuffix(s, ".")
}

// ParseNumber reads an int field: 0 for an empty or unreadable one, the way
// Number() yields NaN and the TypeScript decoder moves on.
func ParseNumber(s string) int {
	n, _ := strconv.Atoi(s)

	return n
}

// ParseFloat reads a float field, 0 for an empty or unreadable one.
func ParseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)

	return f
}

var (
	// IBAN regex: 2 letters + 2 digits + up to 30 alphanumeric.
	ibanRegex = regexp.MustCompile(`^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$`)

	// BIC regex: 4 letters + 2 letters + 2 alphanumeric + optional 3 alphanumeric
	bicRegex = regexp.MustCompile(`^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$`)
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
			fmt.Fprintf(&numeric, "%d", int(ch)-'A'+10)
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

// IsValidDate checks that date is YYYYMMDD and names a real calendar day.
func IsValidDate(date string) bool {
	_, err := time.Parse("20060102", date)

	return err == nil
}

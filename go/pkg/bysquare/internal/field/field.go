// Package field is what the pay and invoice serializers share about a single
// tab-separated field: cleaning it, printing and reading numbers, and the
// format checks the validations run. The TypeScript implementation keeps
// these private to each file; here one package serves both.
package field

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// Sanitize replaces the field separator inside a value with a space.
//
// @see 3.8.
func Sanitize(s string) string {
	return strings.ReplaceAll(s, "\t", " ")
}

// isAccountCodeSeparator reports whether r is a hyphen or a character the
// \s of JavaScript matches, so that both implementations drop the same
// ones. unicode.IsSpace differs from \s in two: it has U+0085 and lacks
// U+FEFF.
func isAccountCodeSeparator(r rune) bool {
	switch r {
	case '-', '\uFEFF':
		return true
	case '\u0085':
		return false
	}

	return unicode.IsSpace(r)
}

// FormatAccountCode prints an IBAN or a BIC in its electronic form, without
// whitespace or hyphens and with the letters a to z in upper case. The
// validation accepts the printed form ("SK96 1100 ..."), which banking apps
// do not read from a QR.
//
// Only a to z are upper-cased: on other letters strings.ToUpper and the
// toUpperCase of JavaScript disagree (ß stays in one and becomes SS in the
// other), and the payload would differ between the implementations.
//
// @see Table 15 fields #13, #14
func FormatAccountCode(s string) string {
	return strings.Map(func(r rune) rune {
		if isAccountCodeSeparator(r) {
			return -1
		}

		if 'a' <= r && r <= 'z' {
			return r - 'a' + 'A'
		}

		return r
	}, s)
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
// rounded to maxDecimals and in its shortest form: printing the rounded
// string as it is would carry the noise of a float64 from about 1e8 on,
// 123456789012.34 as 123456789012.33999634.
func FormatFloatRequired(f float64) string {
	rounded, _ := strconv.ParseFloat(strconv.FormatFloat(f, 'f', maxDecimals, 64), 64)

	// A negative value that rounds to zero would keep its sign.
	if rounded == 0 {
		return "0"
	}

	return strconv.FormatFloat(rounded, 'f', -1, 64)
}

// maxAmountLength is the characters a number field may take written out.
//
// @see Table 15 field #4
const maxAmountLength = 15

// IsValidAmount checks that the amount is a finite number, not negative, and
// at most maxAmountLength characters written out. Zero is accepted.
//
// @see Table 15 field #4
func IsValidAmount(f float64) bool {
	if math.IsNaN(f) || math.IsInf(f, 0) || f < 0 {
		return false
	}

	return len(FormatFloatRequired(f)) <= maxAmountLength
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

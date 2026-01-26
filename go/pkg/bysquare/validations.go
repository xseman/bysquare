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

// ValidationError represents a validation error with path information.
type ValidationError struct {
	Message string
	Path    string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s (path: %s)", e.Message, e.Path)
}

// validateDataModel validates the complete data model.
func validateDataModel(model *DataModel) error {
	if len(model.Payments) == 0 {
		return &ValidationError{
			Message: "at least one payment required",
			Path:    "payments",
		}
	}

	for i, payment := range model.Payments {
		path := fmt.Sprintf("payments[%d]", i)
		if err := validateSimplePayment(&payment, path); err != nil {
			return err
		}
	}

	return nil
}

// validateSimplePayment validates a single payment.
func validateSimplePayment(payment *SimplePayment, path string) error {
	// Validate bank accounts
	if len(payment.BankAccounts) == 0 {
		return &ValidationError{
			Message: "at least one bank account required",
			Path:    fmt.Sprintf("%s.bankAccounts", path),
		}
	}

	for i, account := range payment.BankAccounts {
		accountPath := fmt.Sprintf("%s.bankAccounts[%d]", path, i)
		if err := validateBankAccount(&account, accountPath); err != nil {
			return err
		}
	}

	// Validate currency code if provided
	if payment.CurrencyCode != "" {
		if !isValidCurrencyCode(string(payment.CurrencyCode)) {
			return &ValidationError{
				Message: "invalid currency code (ISO 4217)",
				Path:    fmt.Sprintf("%s.currencyCode", path),
			}
		}
	}

	// Validate payment due date if provided
	if payment.PaymentDueDate != "" {
		if !isValidDate(payment.PaymentDueDate) {
			return &ValidationError{
				Message: "invalid date format (YYYYMMDD per v1.2 specification)",
				Path:    fmt.Sprintf("%s.paymentDueDate", path),
			}
		}
	}

	// Validate lastDate for standing orders
	if payment.Type == PaymentTypeStandingOrder && payment.StandingOrderExt != nil {
		if payment.StandingOrderExt.LastDate != "" && !isValidDate(payment.StandingOrderExt.LastDate) {
			return &ValidationError{
				Message: "invalid date format (YYYYMMDD per v1.2 specification)",
				Path:    fmt.Sprintf("%s.standingOrderExt.lastDate", path),
			}
		}
	}

	// Validate beneficiary name (required since v1.2.0)
	if payment.Beneficiary == nil || payment.Beneficiary.Name == "" {
		return &ValidationError{
			Message: "beneficiary name is required",
			Path:    fmt.Sprintf("%s.beneficiary.name", path),
		}
	}

	return nil
}

// validateBankAccount validates IBAN and BIC.
func validateBankAccount(account *BankAccount, path string) error {
	// Validate IBAN
	if !isValidIBAN(account.IBAN) {
		return &ValidationError{
			Message: "invalid IBAN (ISO 13616)",
			Path:    fmt.Sprintf("%s.iban", path),
		}
	}

	// Validate BIC if provided
	if account.BIC != "" && !isValidBIC(account.BIC) {
		return &ValidationError{
			Message: "invalid BIC (ISO 9362)",
			Path:    fmt.Sprintf("%s.bic", path),
		}
	}

	return nil
}

// isValidIBAN checks if IBAN is valid using MOD-97 algorithm.
func isValidIBAN(iban string) bool {
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

// isValidBIC checks if BIC is valid.
func isValidBIC(bic string) bool {
	bic = strings.ToUpper(bic)
	return bicRegex.MatchString(bic)
}

// isValidCurrencyCode checks if currency code is valid (ISO 4217).
func isValidCurrencyCode(code string) bool {
	// Simple validation: 3 uppercase letters
	// Full validation would require checking against ISO 4217 list
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

// isValidDate checks if date is in YYYYMMDD format per v1.2 specification.
// It performs both format validation and semantic calendar validation.
func isValidDate(date string) bool {
	if !dateRegex.MatchString(date) {
		return false
	}

	// Parse year, month, day
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

	// Validate month range
	if month < 1 || month > 12 {
		return false
	}

	// Validate day range
	if day < 1 || day > 31 {
		return false
	}

	// Check if the date is valid using time package
	// Create a time.Time and verify it matches the input
	t := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)

	return t.Year() == year && int(t.Month()) == month && t.Day() == day
}

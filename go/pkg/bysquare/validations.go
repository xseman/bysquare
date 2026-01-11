package bysquare

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

var (
	// ErrInvalidIBAN indicates an invalid IBAN format.
	ErrInvalidIBAN = errors.New("invalid IBAN format")

	// ErrInvalidBIC indicates an invalid BIC format.
	ErrInvalidBIC = errors.New("invalid BIC format")

	// ErrInvalidCurrency indicates an invalid currency code.
	ErrInvalidCurrency = errors.New("invalid currency code")

	// ErrInvalidDate indicates an invalid date format.
	ErrInvalidDate = errors.New("invalid date format")

	// ErrMissingBankAccount indicates no bank accounts provided.
	ErrMissingBankAccount = errors.New("at least one bank account required")
)

var (
	// IBAN regex: 2 letters + 2 digits + up to 30 alphanumeric
	ibanRegex = regexp.MustCompile(`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`)

	// BIC regex: 4 letters + 2 letters + 2 alphanumeric + optional 3 alphanumeric
	bicRegex = regexp.MustCompile(`^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$`)

	// ISO 8601 date regex: YYYY-MM-DD
	dateRegex = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
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
				Message: "invalid date format (ISO 8601: YYYY-MM-DD)",
				Path:    fmt.Sprintf("%s.paymentDueDate", path),
			}
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

// isValidDate checks if date is in ISO 8601 format (YYYY-MM-DD).
func isValidDate(date string) bool {
	return dateRegex.MatchString(date)
}

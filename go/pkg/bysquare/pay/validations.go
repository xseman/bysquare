package pay

import (
	"fmt"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// ValidationError represents a validation error with path information.
type ValidationError struct {
	Message string
	Path    string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s (path: %s)", e.Message, e.Path)
}

// ValidateDataModel validates the complete data model.
func ValidateDataModel(model *DataModel, version ...bysquare.Version) error {
	v := bysquare.Version120
	if len(version) > 0 {
		v = version[0]
	}

	if len(model.Payments) == 0 {
		return &ValidationError{
			Message: "at least one payment required",
			Path:    "payments",
		}
	}

	for i, payment := range model.Payments {
		path := fmt.Sprintf("payments[%d]", i)
		if err := ValidateSimplePayment(&payment, path, v); err != nil {
			return err
		}
	}

	return nil
}

// ValidateSimplePayment validates a single payment.
func ValidateSimplePayment(payment *SimplePayment, path string, version bysquare.Version) error {
	if len(payment.BankAccounts) == 0 {
		return &ValidationError{
			Message: "at least one bank account required",
			Path:    path + ".bankAccounts",
		}
	}

	for i, account := range payment.BankAccounts {
		accountPath := fmt.Sprintf("%s.bankAccounts[%d]", path, i)
		if err := ValidateBankAccount(&account, accountPath); err != nil {
			return err
		}
	}

	if payment.CurrencyCode != "" {
		if !bysquare.IsValidCurrencyCode(string(payment.CurrencyCode)) {
			return &ValidationError{
				Message: "invalid currency code (ISO 4217)",
				Path:    path + ".currencyCode",
			}
		}
	}

	if payment.PaymentDueDate != "" {
		if !bysquare.IsValidDate(payment.PaymentDueDate) {
			return &ValidationError{
				Message: "invalid date format (YYYYMMDD per v1.2 specification)",
				Path:    path + ".paymentDueDate",
			}
		}
	}

	if payment.Type == PaymentTypeStandingOrder && payment.StandingOrderExt != nil {
		if payment.StandingOrderExt.LastDate != "" && !bysquare.IsValidDate(payment.StandingOrderExt.LastDate) {
			return &ValidationError{
				Message: "invalid date format (YYYYMMDD per v1.2 specification)",
				Path:    path + ".standingOrderExt.lastDate",
			}
		}
	}

	if payment.Type == PaymentTypeDirectDebit && payment.DirectDebitExt != nil {
		if payment.DirectDebitExt.ValidTillDate != "" && !bysquare.IsValidDate(payment.DirectDebitExt.ValidTillDate) {
			return &ValidationError{
				Message: "invalid date format (YYYYMMDD per v1.2 specification)",
				Path:    path + ".directDebitExt.validTillDate",
			}
		}
	}

	if version >= bysquare.Version120 && (payment.Beneficiary == nil || payment.Beneficiary.Name == "") {
		return &ValidationError{
			Message: "beneficiary name is required",
			Path:    path + ".beneficiary.name",
		}
	}

	return nil
}

// ValidateBankAccount validates IBAN and BIC.
func ValidateBankAccount(account *BankAccount, path string) error {
	if !bysquare.IsValidIBAN(account.IBAN) {
		return &ValidationError{
			Message: "invalid IBAN (ISO 13616)",
			Path:    path + ".iban",
		}
	}

	if account.BIC != "" && !bysquare.IsValidBIC(account.BIC) {
		return &ValidationError{
			Message: "invalid BIC (ISO 9362)",
			Path:    path + ".bic",
		}
	}

	return nil
}

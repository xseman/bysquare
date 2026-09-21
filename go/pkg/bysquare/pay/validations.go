package pay

import (
	"strconv"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
)

var errorMessages = struct {
	IBAN            string
	BIC             string
	CurrencyCode    string
	Date            string
	BeneficiaryName string
}{
	IBAN:            "Invalid IBAN. Make sure ISO 13616 format is used.",
	BIC:             "Invalid BIC. Make sure ISO 9362 format is used.",
	CurrencyCode:    "Invalid currency code. Make sure ISO 4217 format is used.",
	Date:            "Invalid date. Make sure YYYYMMDD format is used.",
	BeneficiaryName: "Beneficiary name is required.",
}

// ValidateBankAccount checks the IBAN and, when present, the BIC.
func ValidateBankAccount(bankAccount BankAccount, path string) error {
	if !field.IsValidIBAN(bankAccount.IBAN) {
		return &bysquare.ValidationError{Message: errorMessages.IBAN, Path: path + ".iban"}
	}

	if bankAccount.BIC != "" && !field.IsValidBIC(bankAccount.BIC) {
		return &bysquare.ValidationError{Message: errorMessages.BIC, Path: path + ".bic"}
	}

	return nil
}

// ValidateSimplePayment checks one payment: its bank accounts, currency,
// dates, and from version 1.2.0 on the beneficiary name.
func ValidateSimplePayment(simplePayment Payment, path string, version bysquare.Version) error {
	for index, bankAccount := range simplePayment.BankAccounts {
		if err := ValidateBankAccount(bankAccount, path+".bankAccounts["+strconv.Itoa(index)+"]"); err != nil {
			return err
		}
	}

	if simplePayment.CurrencyCode != "" && !field.IsValidCurrencyCode(string(simplePayment.CurrencyCode)) {
		return &bysquare.ValidationError{Message: errorMessages.CurrencyCode, Path: path + ".currencyCode"}
	}

	if simplePayment.PaymentDueDate != "" && !field.IsValidDate(simplePayment.PaymentDueDate) {
		return &bysquare.ValidationError{Message: errorMessages.Date, Path: path + ".paymentDueDate"}
	}

	if simplePayment.Type == PaymentOptionsStandingOrder &&
		simplePayment.LastDate != "" &&
		!field.IsValidDate(simplePayment.LastDate) {
		return &bysquare.ValidationError{Message: errorMessages.Date, Path: path + ".lastDate"}
	}

	if simplePayment.Type == PaymentOptionsDirectDebit &&
		simplePayment.ValidTillDate != "" &&
		!field.IsValidDate(simplePayment.ValidTillDate) {
		return &bysquare.ValidationError{Message: errorMessages.Date, Path: path + ".validTillDate"}
	}

	if version >= bysquare.Version120 && simplePayment.Beneficiary.Name == "" {
		return &bysquare.ValidationError{Message: errorMessages.BeneficiaryName, Path: path + ".beneficiary.name"}
	}

	return nil
}

// ValidateDataModel checks every payment; the version defaults to 1.2.0.
func ValidateDataModel(dataModel DataModel, version ...bysquare.Version) error {
	v := bysquare.Version120
	if len(version) > 0 {
		v = version[0]
	}

	for index, payment := range dataModel.Payments {
		if err := ValidateSimplePayment(payment, "payments["+strconv.Itoa(index)+"]", v); err != nil {
			return err
		}
	}

	return nil
}

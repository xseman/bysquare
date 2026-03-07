package invoice

import (
	"fmt"
	"regexp"

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

var currencyCodeRegex = regexp.MustCompile(`^[A-Z]{3}$`)

func isValidYyyymmdd(date string) bool {
	return bysquare.IsValidDate(date)
}

func validateRequired(value string, path string) error {
	if value == "" {
		return &ValidationError{
			Message: "field is required",
			Path:    path,
		}
	}
	return nil
}

func validateDate(value string, path string) error {
	if value != "" && !isValidYyyymmdd(value) {
		return &ValidationError{
			Message: "invalid date format (YYYYMMDD)",
			Path:    path,
		}
	}
	return nil
}

// ValidateDataModel validates the complete invoice data model.
func ValidateDataModel(model *DataModel) error {
	if err := validateRequired(model.InvoiceID, "invoiceId"); err != nil {
		return err
	}
	if err := validateRequired(model.IssueDate, "issueDate"); err != nil {
		return err
	}
	if err := validateDate(model.IssueDate, "issueDate"); err != nil {
		return err
	}
	if err := validateDate(model.TaxPointDate, "taxPointDate"); err != nil {
		return err
	}
	if err := validateRequired(model.LocalCurrencyCode, "localCurrencyCode"); err != nil {
		return err
	}

	if !currencyCodeRegex.MatchString(model.LocalCurrencyCode) {
		return &ValidationError{
			Message: "invalid currency code (ISO 4217)",
			Path:    "localCurrencyCode",
		}
	}

	// Foreign currency group validation
	hasForeign := model.ForeignCurrencyCode != ""
	hasCurrRate := model.CurrRate != 0
	hasRefRate := model.ReferenceCurrRate != 0

	if hasForeign != hasCurrRate || hasForeign != hasRefRate {
		return &ValidationError{
			Message: "when any of foreignCurrencyCode, currRate, or referenceCurrRate is set, all three are required",
			Path:    "foreignCurrencyCode",
		}
	}

	if hasForeign && !currencyCodeRegex.MatchString(model.ForeignCurrencyCode) {
		return &ValidationError{
			Message: "invalid currency code (ISO 4217)",
			Path:    "foreignCurrencyCode",
		}
	}

	// Supplier party
	if err := validateRequired(model.SupplierParty.PartyName, "supplierParty.partyName"); err != nil {
		return err
	}
	if err := validateRequired(model.SupplierParty.PostalAddress.StreetName, "supplierParty.postalAddress.streetName"); err != nil {
		return err
	}
	if err := validateRequired(model.SupplierParty.PostalAddress.CityName, "supplierParty.postalAddress.cityName"); err != nil {
		return err
	}
	if err := validateRequired(model.SupplierParty.PostalAddress.PostalZone, "supplierParty.postalAddress.postalZone"); err != nil {
		return err
	}
	if err := validateRequired(model.SupplierParty.PostalAddress.Country, "supplierParty.postalAddress.country"); err != nil {
		return err
	}

	if model.SupplierParty.PostalAddress.Country != "" && !currencyCodeRegex.MatchString(model.SupplierParty.PostalAddress.Country) {
		return &ValidationError{
			Message: "invalid country code (3 uppercase letters)",
			Path:    "supplierParty.postalAddress.country",
		}
	}

	// Customer party
	if err := validateRequired(model.CustomerParty.PartyName, "customerParty.partyName"); err != nil {
		return err
	}

	// Invoice line choice: exactly one of numberOfInvoiceLines or singleInvoiceLine
	hasLineCount := model.NumberOfInvoiceLines != nil
	hasSingleLine := model.SingleInvoiceLine != nil
	if hasLineCount == hasSingleLine {
		return &ValidationError{
			Message: "exactly one of numberOfInvoiceLines or singleInvoiceLine must be set",
			Path:    "numberOfInvoiceLines",
		}
	}

	if hasLineCount && *model.NumberOfInvoiceLines <= 0 {
		return &ValidationError{
			Message: "numberOfInvoiceLines must be a positive integer",
			Path:    "numberOfInvoiceLines",
		}
	}

	// Single invoice line validation
	if model.SingleInvoiceLine != nil {
		line := model.SingleInvoiceLine
		hasName := line.ItemName != ""
		hasEan := line.ItemEanCode != ""
		if hasName == hasEan {
			return &ValidationError{
				Message: "exactly one of itemName or itemEanCode must be set",
				Path:    "singleInvoiceLine.itemName",
			}
		}

		hasFrom := line.PeriodFromDate != ""
		hasTo := line.PeriodToDate != ""
		if hasFrom != hasTo {
			return &ValidationError{
				Message: "both periodFromDate and periodToDate must be set together",
				Path:    "singleInvoiceLine.periodFromDate",
			}
		}
		if hasFrom && hasTo {
			if err := validateDate(line.PeriodFromDate, "singleInvoiceLine.periodFromDate"); err != nil {
				return err
			}
			if err := validateDate(line.PeriodToDate, "singleInvoiceLine.periodToDate"); err != nil {
				return err
			}
			if line.PeriodFromDate > line.PeriodToDate {
				return &ValidationError{
					Message: "periodFromDate must not be after periodToDate",
					Path:    "singleInvoiceLine.periodFromDate",
				}
			}
		}
	}

	// Tax category summaries
	if len(model.TaxCategorySummaries) == 0 {
		return &ValidationError{
			Message: "at least one tax category summary is required",
			Path:    "taxCategorySummaries",
		}
	}

	for idx, summary := range model.TaxCategorySummaries {
		if summary.ClassifiedTaxCategory < 0 || summary.ClassifiedTaxCategory > 1 {
			return &ValidationError{
				Message: "classifiedTaxCategory must be a number in range [0, 1]",
				Path:    fmt.Sprintf("taxCategorySummaries[%d].classifiedTaxCategory", idx),
			}
		}
	}

	return nil
}

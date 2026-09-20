package invoice

import (
	"regexp"
	"strconv"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/field"
)

var errorMessages = struct {
	Required                     string
	CurrencyCode                 string
	CountryCode                  string
	ForeignCurrencyGroup         string
	InvoiceLineChoice            string
	ItemChoice                   string
	TaxCategorySummariesEmpty    string
	ClassifiedTaxCategory        string
	Date                         string
	PeriodDateConsistency        string
	NumberOfInvoiceLinesPositive string
}{
	Required:                     "Field is required.",
	CurrencyCode:                 "Invalid currency code. Must be 3 uppercase letters (ISO 4217).",
	CountryCode:                  "Invalid country code. Must be 3 uppercase letters.",
	ForeignCurrencyGroup:         "When any of foreignCurrencyCode, currRate, or referenceCurrRate is set, all three are required.",
	InvoiceLineChoice:            "Exactly one of numberOfInvoiceLines or singleInvoiceLine must be set.",
	ItemChoice:                   "Exactly one of itemName or itemEanCode must be set.",
	TaxCategorySummariesEmpty:    "At least one tax category summary is required.",
	ClassifiedTaxCategory:        "classifiedTaxCategory must be a number in range [0, 1].",
	Date:                         "Invalid date. Make sure YYYYMMDD format is used.",
	PeriodDateConsistency:        "Both periodFromDate and periodToDate must be set together, and periodFromDate must not be after periodToDate.",
	NumberOfInvoiceLinesPositive: "numberOfInvoiceLines must be a positive integer.",
}

var currencyCodeRegex = regexp.MustCompile(`^[A-Z]{3}$`)

func validateRequired(value, path string) error {
	if value == "" {
		return &bysquare.ValidationError{
			Message: errorMessages.Required,
			Path:    path,
		}
	}

	return nil
}

func validateDate(value, path string) error {
	if value != "" && !field.IsValidDate(value) {
		return &bysquare.ValidationError{
			Message: errorMessages.Date,
			Path:    path,
		}
	}

	return nil
}

// ValidateDataModel validates the complete invoice data model.
func ValidateDataModel(model DataModel) error {
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
		return &bysquare.ValidationError{
			Message: errorMessages.CurrencyCode,
			Path:    "localCurrencyCode",
		}
	}

	// Foreign currency group validation
	hasForeign := model.ForeignCurrencyCode != ""
	hasCurrRate := model.CurrRate != 0
	hasRefRate := model.ReferenceCurrRate != 0

	if hasForeign != hasCurrRate || hasForeign != hasRefRate {
		return &bysquare.ValidationError{
			Message: errorMessages.ForeignCurrencyGroup,
			Path:    "foreignCurrencyCode",
		}
	}

	if hasForeign && !currencyCodeRegex.MatchString(model.ForeignCurrencyCode) {
		return &bysquare.ValidationError{
			Message: errorMessages.CurrencyCode,
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
		return &bysquare.ValidationError{
			Message: errorMessages.CountryCode,
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
		return &bysquare.ValidationError{
			Message: errorMessages.InvoiceLineChoice,
			Path:    "numberOfInvoiceLines",
		}
	}

	if hasLineCount && *model.NumberOfInvoiceLines <= 0 {
		return &bysquare.ValidationError{
			Message: errorMessages.NumberOfInvoiceLinesPositive,
			Path:    "numberOfInvoiceLines",
		}
	}

	if err := validateSingleInvoiceLine(model.SingleInvoiceLine); err != nil {
		return err
	}

	// Tax category summaries
	if len(model.TaxCategorySummaries) == 0 {
		return &bysquare.ValidationError{
			Message: errorMessages.TaxCategorySummariesEmpty,
			Path:    "taxCategorySummaries",
		}
	}

	for idx, summary := range model.TaxCategorySummaries {
		if summary.ClassifiedTaxCategory < 0 || summary.ClassifiedTaxCategory > 1 {
			return &bysquare.ValidationError{
				Message: errorMessages.ClassifiedTaxCategory,
				Path:    "taxCategorySummaries[" + strconv.Itoa(idx) + "].classifiedTaxCategory",
			}
		}
	}

	return nil
}

// validateSingleInvoiceLine checks the optional single line: exactly one of
// the name or the EAN code, and a period given as both dates or neither.
func validateSingleInvoiceLine(line *SingleInvoiceLine) error {
	if line == nil {
		return nil
	}

	if hasName, hasEan := line.ItemName != "", line.ItemEanCode != ""; hasName == hasEan {
		return &bysquare.ValidationError{
			Message: errorMessages.ItemChoice,
			Path:    "singleInvoiceLine.itemName",
		}
	}

	hasFrom, hasTo := line.PeriodFromDate != "", line.PeriodToDate != ""
	if hasFrom != hasTo {
		return &bysquare.ValidationError{
			Message: errorMessages.PeriodDateConsistency,
			Path:    "singleInvoiceLine.periodFromDate",
		}
	}

	if !hasFrom {
		return nil
	}

	if err := validateDate(line.PeriodFromDate, "singleInvoiceLine.periodFromDate"); err != nil {
		return err
	}

	if err := validateDate(line.PeriodToDate, "singleInvoiceLine.periodToDate"); err != nil {
		return err
	}

	if line.PeriodFromDate > line.PeriodToDate {
		return &bysquare.ValidationError{
			Message: errorMessages.PeriodDateConsistency,
			Path:    "singleInvoiceLine.periodFromDate",
		}
	}

	return nil
}

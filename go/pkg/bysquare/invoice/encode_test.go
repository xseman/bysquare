package invoice

import (
	"strings"
	"testing"
)

func minimalInvoice() *DataModel {
	numLines := 5
	return &DataModel{
		DocumentType:      InvoiceDocumentTypeInvoice,
		InvoiceID:         "INV-001",
		IssueDate:         "20240101",
		LocalCurrencyCode: "EUR",
		SupplierParty: SupplierParty{
			Party: Party{
				PartyName:    "Supplier s.r.o.",
				CompanyTaxID: "1234567890",
			},
			PostalAddress: PostalAddress{
				StreetName: "Main Street",
				CityName:   "Bratislava",
				PostalZone: "81101",
				Country:    "SVK",
			},
		},
		CustomerParty: CustomerParty{
			Party: Party{
				PartyName: "Customer a.s.",
			},
		},
		NumberOfInvoiceLines: &numLines,
		TaxCategorySummaries: []TaxCategorySummary{{
			ClassifiedTaxCategory: 0.20,
			TaxExclusiveAmount:    1_000,
			TaxAmount:             200,
		}},
	}
}

func TestSerialize(t *testing.T) {
	model := minimalInvoice()

	result := serialize(model)

	expectedParts := []string{"INV-001", "20240101", "EUR", "Supplier s.r.o.", "Main Street", "Bratislava"}
	for _, part := range expectedParts {
		if !strings.Contains(result, part) {
			t.Errorf("serialize() result missing %q", part)
		}
	}

	fields := strings.Split(result, "\t")
	if len(fields) < 40 {
		t.Errorf("expected at least 40 fields, got %d", len(fields))
	}
}

func TestSerializeFieldCount(t *testing.T) {
	model := minimalInvoice()

	result := serialize(model)
	fields := strings.Split(result, "\t")

	// 40 base fields + (1 tax category * 5 fields) = 45
	expected := 40 + 1*5
	if len(fields) != expected {
		t.Errorf("expected %d fields, got %d", expected, len(fields))
	}
}

func TestSerializeMultipleTaxCategories(t *testing.T) {
	model := minimalInvoice()
	model.TaxCategorySummaries = []TaxCategorySummary{
		{ClassifiedTaxCategory: 0.20, TaxExclusiveAmount: 800, TaxAmount: 160},
		{ClassifiedTaxCategory: 0.10, TaxExclusiveAmount: 200, TaxAmount: 20},
	}

	result := serialize(model)
	fields := strings.Split(result, "\t")

	// 40 base fields + (2 tax categories * 5 fields) = 50
	expected := 40 + 2*5
	if len(fields) != expected {
		t.Errorf("expected %d fields, got %d", expected, len(fields))
	}
}

func TestEncode(t *testing.T) {
	model := minimalInvoice()

	result, err := Encode(model)
	if err != nil {
		t.Fatalf("Encode() error: %v", err)
	}

	if len(result) < 10 {
		t.Errorf("encoded result too short: %d", len(result))
	}

	// bysquareType=1, version=0 → byte[0] = 0x10, byte[1] = 0x00
	// base32hex first 5 bits of 0x10: 00010 = 2 → '2', next 5: 00000 = 0 → '0'
	if !strings.HasPrefix(result, "20") {
		t.Errorf("expected prefix '20' for invoice type, got %q", result[:4])
	}
}

func TestEncodeAllDocumentTypes(t *testing.T) {
	docTypes := []struct {
		name    string
		docType InvoiceDocumentType
	}{
		{"Invoice", InvoiceDocumentTypeInvoice},
		{"ProformaInvoice", InvoiceDocumentTypeProformaInvoice},
		{"CreditNote", InvoiceDocumentTypeCreditNote},
		{"DebitNote", InvoiceDocumentTypeDebitNote},
		{"AdvanceInvoice", InvoiceDocumentTypeAdvanceInvoice},
	}

	for _, tt := range docTypes {
		t.Run(tt.name, func(t *testing.T) {
			model := minimalInvoice()
			model.DocumentType = tt.docType

			result, err := Encode(model)
			if err != nil {
				t.Fatalf("Encode() error: %v", err)
			}

			if len(result) < 10 {
				t.Errorf("encoded result too short: %d", len(result))
			}
		})
	}
}

func TestEncodeValidationError(t *testing.T) {
	model := &DataModel{
		DocumentType: InvoiceDocumentTypeInvoice,
	}

	_, err := Encode(model)
	if err == nil {
		t.Error("expected validation error for empty model")
	}
}

func TestEncodeSkipValidation(t *testing.T) {
	model := minimalInvoice()
	model.InvoiceID = ""

	_, err := Encode(model, EncodeOptions{Validate: false})
	if err != nil {
		t.Errorf("expected no error when validation is skipped, got: %v", err)
	}
}

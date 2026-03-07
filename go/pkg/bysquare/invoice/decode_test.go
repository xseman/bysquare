package invoice

import (
	"testing"
)

func TestDecodeInvalidInput(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"empty string", ""},
		{"too short", "10"},
		{"invalid base32hex", "!!!INVALID!!!"},
		{"pay type header", "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(tt.input)
			if err == nil {
				t.Errorf("expected error for input %q", tt.input)
			}
		})
	}
}

func TestRoundTrip(t *testing.T) {
	numLines := 3
	model := &DataModel{
		DocumentType:        InvoiceDocumentTypeInvoice,
		InvoiceID:           "INV-2024-001",
		IssueDate:           "20240115",
		TaxPointDate:        "20240115",
		OrderID:             "ORD-123",
		DeliveryNoteID:      "DN-456",
		LocalCurrencyCode:   "EUR",
		ForeignCurrencyCode: "USD",
		CurrRate:            1.1,
		ReferenceCurrRate:   1,
		SupplierParty: SupplierParty{
			Party: Party{
				PartyName:         "Dodavatel s.r.o.",
				CompanyTaxID:      "1234567890",
				CompanyVatID:      "SK1234567890",
				CompanyRegisterID: "OR-12345",
			},
			PostalAddress: PostalAddress{
				StreetName:     "Hlavna",
				BuildingNumber: "1",
				CityName:       "Bratislava",
				PostalZone:     "81101",
				State:          "SK",
				Country:        "SVK",
			},
			Contact: &Contact{
				Name:      "Jan Novak",
				Telephone: "+421900123456",
				Email:     "jan@example.com",
			},
		},
		CustomerParty: CustomerParty{
			Party: Party{
				PartyName:         "Odberatel a.s.",
				CompanyTaxID:      "9876543210",
				CompanyVatID:      "SK9876543210",
				CompanyRegisterID: "OR-67890",
			},
			PartyIdentification: "CUST-001",
		},
		NumberOfInvoiceLines: &numLines,
		InvoiceDescription:   "Monthly services",
		TaxCategorySummaries: []TaxCategorySummary{
			{
				ClassifiedTaxCategory:            0.20,
				TaxExclusiveAmount:               1_000,
				TaxAmount:                        200,
				AlreadyClaimedTaxExclusiveAmount: 100,
				AlreadyClaimedTaxAmount:          20,
			},
		},
		MonetarySummary: MonetarySummary{
			PayableRoundingAmount: 0.01,
			PaidDepositsAmount:    50,
		},
		PaymentMeans: uint8(PaymentMeanMoneyTransfer | PaymentMeanCreditCard),
	}

	encoded, err := Encode(model)
	if err != nil {
		t.Fatalf("Encode() error: %v", err)
	}

	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode() error: %v", err)
	}

	if decoded.InvoiceID != model.InvoiceID {
		t.Errorf("InvoiceID: got %q, want %q", decoded.InvoiceID, model.InvoiceID)
	}
	if decoded.DocumentType != model.DocumentType {
		t.Errorf("DocumentType: got %d, want %d", decoded.DocumentType, model.DocumentType)
	}
	if decoded.IssueDate != model.IssueDate {
		t.Errorf("IssueDate: got %q, want %q", decoded.IssueDate, model.IssueDate)
	}
	if decoded.LocalCurrencyCode != model.LocalCurrencyCode {
		t.Errorf("LocalCurrencyCode: got %q, want %q", decoded.LocalCurrencyCode, model.LocalCurrencyCode)
	}
	if decoded.ForeignCurrencyCode != model.ForeignCurrencyCode {
		t.Errorf("ForeignCurrencyCode: got %q, want %q", decoded.ForeignCurrencyCode, model.ForeignCurrencyCode)
	}
	if decoded.SupplierParty.PartyName != model.SupplierParty.PartyName {
		t.Errorf("SupplierParty.PartyName: got %q, want %q", decoded.SupplierParty.PartyName, model.SupplierParty.PartyName)
	}
	if decoded.CustomerParty.PartyName != model.CustomerParty.PartyName {
		t.Errorf("CustomerParty.PartyName: got %q, want %q", decoded.CustomerParty.PartyName, model.CustomerParty.PartyName)
	}

	if decoded.SupplierParty.Contact == nil {
		t.Fatal("SupplierParty.Contact should not be nil")
	}
	if decoded.SupplierParty.Contact.Email != model.SupplierParty.Contact.Email {
		t.Errorf("Contact.Email: got %q, want %q", decoded.SupplierParty.Contact.Email, model.SupplierParty.Contact.Email)
	}

	if len(decoded.TaxCategorySummaries) != len(model.TaxCategorySummaries) {
		t.Fatalf("TaxCategorySummaries count: got %d, want %d", len(decoded.TaxCategorySummaries), len(model.TaxCategorySummaries))
	}
	if decoded.TaxCategorySummaries[0].TaxAmount != model.TaxCategorySummaries[0].TaxAmount {
		t.Errorf("TaxAmount: got %v, want %v", decoded.TaxCategorySummaries[0].TaxAmount, model.TaxCategorySummaries[0].TaxAmount)
	}

	if decoded.PaymentMeans != model.PaymentMeans {
		t.Errorf("PaymentMeans: got %d, want %d", decoded.PaymentMeans, model.PaymentMeans)
	}
}

func TestRoundTripWithSingleInvoiceLine(t *testing.T) {
	model := &DataModel{
		DocumentType:      InvoiceDocumentTypeInvoice,
		InvoiceID:         "INV-LINE",
		IssueDate:         "20240201",
		LocalCurrencyCode: "EUR",
		SupplierParty: SupplierParty{
			Party: Party{PartyName: "Supplier"},
			PostalAddress: PostalAddress{
				StreetName: "Street",
				CityName:   "City",
				PostalZone: "12345",
				Country:    "SVK",
			},
		},
		CustomerParty: CustomerParty{
			Party: Party{PartyName: "Customer"},
		},
		SingleInvoiceLine: &SingleInvoiceLine{
			ItemName:         "Service XYZ",
			PeriodFromDate:   "20240101",
			PeriodToDate:     "20240131",
			InvoicedQuantity: 10,
		},
		TaxCategorySummaries: []TaxCategorySummary{{
			ClassifiedTaxCategory: 0.20,
			TaxExclusiveAmount:    500,
			TaxAmount:             100,
		}},
	}

	encoded, err := Encode(model)
	if err != nil {
		t.Fatalf("Encode() error: %v", err)
	}

	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode() error: %v", err)
	}

	if decoded.SingleInvoiceLine == nil {
		t.Fatal("SingleInvoiceLine should not be nil")
	}
	if decoded.SingleInvoiceLine.ItemName != "Service XYZ" {
		t.Errorf("ItemName: got %q, want %q", decoded.SingleInvoiceLine.ItemName, "Service XYZ")
	}
	if decoded.SingleInvoiceLine.InvoicedQuantity != 10 {
		t.Errorf("InvoicedQuantity: got %v, want 10", decoded.SingleInvoiceLine.InvoicedQuantity)
	}
}

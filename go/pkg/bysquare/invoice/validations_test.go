package invoice

import (
	"testing"
)

func TestValidateDataModel(t *testing.T) {
	tests := []struct {
		name    string
		model   *DataModel
		wantErr bool
	}{
		{
			name:    "valid minimal invoice",
			model:   minimalInvoice(),
			wantErr: false,
		},
		{
			name: "missing invoiceId",
			model: func() *DataModel {
				m := minimalInvoice()
				m.InvoiceID = ""
				return m
			}(),
			wantErr: true,
		},
		{
			name: "missing issueDate",
			model: func() *DataModel {
				m := minimalInvoice()
				m.IssueDate = ""
				return m
			}(),
			wantErr: true,
		},
		{
			name: "missing supplierParty name",
			model: func() *DataModel {
				m := minimalInvoice()
				m.SupplierParty.PartyName = ""
				return m
			}(),
			wantErr: true,
		},
		{
			name: "missing customerParty name",
			model: func() *DataModel {
				m := minimalInvoice()
				m.CustomerParty.PartyName = ""
				return m
			}(),
			wantErr: true,
		},
		{
			name: "both numberOfInvoiceLines and singleInvoiceLine",
			model: func() *DataModel {
				m := minimalInvoice()
				m.SingleInvoiceLine = &SingleInvoiceLine{
					ItemName: "Test",
				}
				return m
			}(),
			wantErr: true,
		},
		{
			name: "empty tax categories",
			model: func() *DataModel {
				m := minimalInvoice()
				m.TaxCategorySummaries = []TaxCategorySummary{}
				return m
			}(),
			wantErr: true,
		},
		{
			name: "tax category out of range",
			model: func() *DataModel {
				m := minimalInvoice()
				m.TaxCategorySummaries[0].ClassifiedTaxCategory = 1.5
				return m
			}(),
			wantErr: true,
		},
		{
			name: "partial foreign currency (missing rates)",
			model: func() *DataModel {
				m := minimalInvoice()
				m.ForeignCurrencyCode = "USD"
				return m
			}(),
			wantErr: true,
		},
		{
			name: "valid foreign currency group",
			model: func() *DataModel {
				m := minimalInvoice()
				m.ForeignCurrencyCode = "USD"
				m.CurrRate = 1.1
				m.ReferenceCurrRate = 1
				return m
			}(),
			wantErr: false,
		},
		{
			name: "single invoice line with item name",
			model: func() *DataModel {
				m := minimalInvoice()
				m.NumberOfInvoiceLines = nil
				m.SingleInvoiceLine = &SingleInvoiceLine{
					ItemName: "Service",
				}
				return m
			}(),
			wantErr: false,
		},
		{
			name: "single invoice line missing both item identifiers",
			model: func() *DataModel {
				m := minimalInvoice()
				m.NumberOfInvoiceLines = nil
				m.SingleInvoiceLine = &SingleInvoiceLine{}
				return m
			}(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateDataModel(tt.model)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDataModel() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

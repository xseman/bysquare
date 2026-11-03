package invoice_test

import (
	"fmt"
	"log"

	"github.com/xseman/bysquare/go/pkg/bysquare/invoice"
)

func ExampleEncode() {
	numberOfInvoiceLines := 5
	model := invoice.DataModel{
		DocumentType:      invoice.InvoiceDocumentTypeInvoice,
		InvoiceID:         "INV-2025-001",
		IssueDate:         "20250101",
		LocalCurrencyCode: "EUR",
		SupplierParty: invoice.SupplierParty{
			Party: invoice.Party{PartyName: "Supplier s.r.o."},
			PostalAddress: invoice.PostalAddress{
				StreetName: "Main Street 1",
				CityName:   "Bratislava",
				PostalZone: "81101",
				Country:    "SVK",
			},
		},
		CustomerParty: invoice.CustomerParty{
			Party: invoice.Party{PartyName: "Customer a.s."},
		},
		NumberOfInvoiceLines: &numberOfInvoiceLines,
		TaxCategorySummaries: []invoice.TaxCategorySummary{
			{
				ClassifiedTaxCategory: 0.2,
				TaxExclusiveAmount:    1000,
				TaxAmount:             200,
			},
		},
	}

	qr, err := invoice.Encode(model)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(qr)
	// Output:
	// 2008S0000E4LKHQ2Q9GQ0DNPQMAV4I7T91RJQ2VG54K9T4EEJ24LN3N0B5QID4GU73MIBGC0RJ5IG06RVJVI4QN8INSRF0AP329INGSSGE1HRMQ3DNG4F18LFT24MNRHU2EGUR1JTIIMVLP1SEEC8PDBG5V5PSSHRC5AR41CMMRMO58TNR0CNP1SL15USQUOQF00
}

func ExampleDecode() {
	model, err := invoice.Decode("2008S0000E4LKHQ2Q9GQ0DNPQMAV4I7T91RJQ2VG54K9T4EEJ24LN3N0B5QID4GU73MIBGC0RJ5IG06RVJVI4QN8INSRF0AP329INGSSGE1HRMQ3DNG4F18LFT24MNRHU2EGUR1JTIIMVLP1SEEC8PDBG5V5PSSHRC5AR41CMMRMO58TNR0CNP1SL15USQUOQF00")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(model.InvoiceID, model.SupplierParty.PartyName, model.TaxCategorySummaries[0].TaxAmount)
	// Output:
	// INV-2025-001 Supplier s.r.o. 200
}

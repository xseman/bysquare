package pay_test

import (
	"errors"
	"fmt"
	"log"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/pay"
)

func ExampleEncode() {
	model := pay.DataModel{
		Payments: []pay.Payment{
			{
				Type: pay.PaymentOptionsPaymentOrder,
				SimplePayment: pay.SimplePayment{
					Amount:         123.45,
					CurrencyCode:   pay.CurrencyEUR,
					VariableSymbol: "987654",
					Beneficiary:    pay.Beneficiary{Name: "John Doe"},
					BankAccounts: []pay.BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
				},
			},
		},
	}

	qr, err := pay.Encode(model)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(qr)
	// Output:
	// 0804K000CGSGEBFG92PSOB3F1H663SV6BKFR2GKITB973E5LR8N9F3CU0J9HVTA9HCU28GV61AOO4C5MT1SNPC9RC87ALKPR51U9B5L386J5KK4PK0
}

func ExampleEncode_options() {
	model := pay.DataModel{
		Payments: []pay.Payment{
			{
				Type: pay.PaymentOptionsPaymentOrder,
				SimplePayment: pay.SimplePayment{
					Amount:       10,
					CurrencyCode: pay.CurrencyEUR,
					Beneficiary:  pay.Beneficiary{Name: "Ján Novák"},
					BankAccounts: []pay.BankAccount{
						{IBAN: "SK9611000000002918599669"},
					},
				},
			},
		},
	}

	// Options replace the defaults as a whole: leaving Deburr or Validate
	// out turns it off.
	qr, err := pay.Encode(model, pay.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version110,
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(qr)
	// Output:
	// 04042000FCPOSH509C62MCETI7NPOT5AT339VMPB1835R46TF8MDGF3404V7289MH5L4P29K3OUBLFQK4FB3N75JTFV7G000
}

func ExampleEncode_validationError() {
	model := pay.DataModel{
		Payments: []pay.Payment{
			{
				Type: pay.PaymentOptionsPaymentOrder,
				SimplePayment: pay.SimplePayment{
					Amount:       10,
					CurrencyCode: pay.CurrencyEUR,
					Beneficiary:  pay.Beneficiary{Name: "John Doe"},
					BankAccounts: []pay.BankAccount{
						{IBAN: "SK0000000000000000000000"},
					},
				},
			},
		},
	}

	_, err := pay.Encode(model)

	var validationErr *bysquare.ValidationError
	if errors.As(err, &validationErr) {
		fmt.Println(validationErr.Path)
	}
	// Output:
	// payments[0].bankAccounts[0].iban
}

func ExampleDecode() {
	model, err := pay.Decode("0804K000CGSGEBFG92PSOB3F1H663SV6BKFR2GKITB973E5LR8N9F3CU0J9HVTA9HCU28GV61AOO4C5MT1SNPC9RC87ALKPR51U9B5L386J5KK4PK0")
	if err != nil {
		log.Fatal(err)
	}

	payment := model.Payments[0]
	fmt.Println(payment.Amount, payment.CurrencyCode, payment.BankAccounts[0].IBAN)
	// Output:
	// 123.45 EUR SK9611000000002918599669
}

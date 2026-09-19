package main

import (
	"strings"
	"testing"
)

func gostr(t *testing.T, p *cChar) string {
	t.Helper()

	if p == nil {
		t.Fatal("nil result")
	}

	defer bysquare_free(p)

	return goString(p)
}

const payJSON = `{"invoiceId":"x","payments":[{"type":1,"amount":1,"currencyCode":"EUR","bankAccounts":[{"iban":"SK9611000000002918599669"}],"beneficiary":{"name":"A"}}]}`

const invoiceJSON = `{"documentType":0,"invoiceId":"INV-1","issueDate":"20250101","localCurrencyCode":"EUR",` +
	`"supplierParty":{"partyName":"S","postalAddress":{"streetName":"M","cityName":"B","postalZone":"1","country":"SVK"}},` +
	`"customerParty":{"partyName":"C"},"numberOfInvoiceLines":1,` +
	`"taxCategorySummaries":[{"classifiedTaxCategory":0.2,"taxExclusiveAmount":1,"taxAmount":0.2}],"monetarySummary":{}}`

func TestPayRoundTrip(t *testing.T) {
	in := cString(payJSON)
	defer freeString(in)

	qr := gostr(t, bysquare_pay_encode(in, -1))
	if strings.HasPrefix(qr, "ERROR:") {
		t.Fatal(qr)
	}

	q := cString(qr)
	defer freeString(q)

	if out := gostr(t, bysquare_pay_decode(q)); !strings.Contains(out, `"invoiceId":"x"`) {
		t.Errorf("decode: %s", out)
	}

	if got := bysquare_detect_type(q); got != 0 {
		t.Errorf("detect_type: got %d, want 0", got)
	}
}

func TestInvoiceRoundTrip(t *testing.T) {
	in := cString(invoiceJSON)
	defer freeString(in)

	qr := gostr(t, bysquare_invoice_encode(in, -1))
	if strings.HasPrefix(qr, "ERROR:") {
		t.Fatal(qr)
	}

	q := cString(qr)
	defer freeString(q)

	if out := gostr(t, bysquare_invoice_decode(q)); !strings.Contains(out, `"invoiceId":"INV-1"`) {
		t.Errorf("decode: %s", out)
	}

	if got := bysquare_detect_type(q); got != 1 {
		t.Errorf("detect_type: got %d, want 1", got)
	}
}

func TestErrors(t *testing.T) {
	if got := gostr(t, bysquare_pay_encode(nil, -1)); got != "ERROR:null input" {
		t.Errorf("nil pay encode: %q", got)
	}

	if got := gostr(t, bysquare_invoice_encode(nil, -1)); got != "ERROR:null input" {
		t.Errorf("nil invoice encode: %q", got)
	}

	if got := gostr(t, bysquare_pay_decode(nil)); got != "ERROR:null input" {
		t.Errorf("nil pay decode: %q", got)
	}

	if got := gostr(t, bysquare_invoice_decode(nil)); got != "ERROR:null input" {
		t.Errorf("nil invoice decode: %q", got)
	}

	if got := bysquare_detect_type(nil); got != -1 {
		t.Errorf("nil detect: %d", got)
	}

	bad := cString("{oops")
	defer freeString(bad)

	if got := gostr(t, bysquare_pay_encode(bad, -1)); !strings.HasPrefix(got, "ERROR:JSON parse error") {
		t.Errorf("bad pay json: %q", got)
	}

	if got := gostr(t, bysquare_invoice_encode(bad, -1)); !strings.HasPrefix(got, "ERROR:JSON parse error") {
		t.Errorf("bad invoice json: %q", got)
	}

	if got := gostr(t, bysquare_pay_decode(bad)); !strings.HasPrefix(got, "ERROR:") {
		t.Errorf("bad pay qr: %q", got)
	}

	if got := gostr(t, bysquare_invoice_decode(bad)); !strings.HasPrefix(got, "ERROR:") {
		t.Errorf("bad invoice qr: %q", got)
	}

	if got := bysquare_detect_type(bad); got != -1 {
		t.Errorf("bad detect: %d", got)
	}

	// Validation off, version 1.0.0: the invalid IBAN encodes anyway.
	noValidate := cString(`{"payments":[{"type":1,"amount":1,"currencyCode":"EUR","bankAccounts":[{"iban":"BAD"}],"beneficiary":{"name":"A"}}]}`)
	defer freeString(noValidate)

	if got := gostr(t, bysquare_pay_encode(noValidate, -1)); !strings.HasPrefix(got, "ERROR:Invalid IBAN") {
		t.Errorf("validated: %q", got)
	}

	if got := gostr(t, bysquare_pay_encode(noValidate, 0)); strings.HasPrefix(got, "ERROR:") {
		t.Errorf("unvalidated: %q", got)
	}

	if got := gostr(t, bysquare_version()); got != "dev" {
		t.Errorf("version: %q", got)
	}
}

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const invoiceJSON = `{"documentType":0,"invoiceId":"INV-1","issueDate":"20250101","localCurrencyCode":"EUR",` +
	`"supplierParty":{"partyName":"Supplier","postalAddress":{"streetName":"Main 1","cityName":"Bratislava","postalZone":"81101","country":"SVK"}},` +
	`"customerParty":{"partyName":"Customer"},"numberOfInvoiceLines":2,` +
	`"taxCategorySummaries":[{"classifiedTaxCategory":0.2,"taxExclusiveAmount":100,"taxAmount":20}],"monetarySummary":{}}`

func writeInvoice(t *testing.T, content string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "invoice.json")
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}

	return path
}

func TestInvoiceEncodeDecodeRoundTrip(t *testing.T) {
	qr, stderr, exitCode := runCLI(t, []string{"invoice", "encode", writeInvoice(t, invoiceJSON)}, "")
	if exitCode != 0 {
		t.Fatalf("encode exit %d: %s", exitCode, stderr)
	}

	if !strings.HasPrefix(qr, "2") {
		t.Errorf("bysquareType 1 must show as a leading '2' in base32hex, got %q", qr[:4])
	}

	for _, args := range [][]string{{"invoice", "decode", qr}, {"decode", qr}} {
		stdout, stderr, exitCode := runCLI(t, args, "")
		if exitCode != 0 {
			t.Fatalf("%v exit %d: %s", args, exitCode, stderr)
		}

		var result map[string]any
		if err := json.Unmarshal([]byte(stdout), &result); err != nil {
			t.Fatalf("%v: %v", args, err)
		}

		if result["invoiceId"] != "INV-1" || result["numberOfInvoiceLines"] != float64(2) {
			t.Errorf("%v decoded %v", args, result)
		}
	}
}

func TestInvoiceEncodeValidationError(t *testing.T) {
	invalid := strings.Replace(invoiceJSON, `"issueDate":"20250101"`, `"issueDate":"2025-01-01"`, 1)
	path := writeInvoice(t, invalid)

	_, stderr, exitCode := runCLI(t, []string{"invoice", "encode", path}, "")
	if exitCode == 0 || !strings.Contains(stderr, "issueDate") {
		t.Errorf("expected a validation error naming issueDate, exit %d: %s", exitCode, stderr)
	}

	if _, stderr, exitCode := runCLI(t, []string{"invoice", "encode", "--no-validate", path}, ""); exitCode != 0 {
		t.Errorf("--no-validate should encode anyway: %s", stderr)
	}
}

func TestInvoiceEncodeErrors(t *testing.T) {
	tests := []struct {
		name string
		args []string
		want string
	}{
		{"missing file argument", []string{"invoice", "encode"}, "missing input file"},
		{"file not found", []string{"invoice", "encode", "/nonexistent.json"}, "no such file"},
		{"invalid json", []string{"invoice", "encode", writeInvoice(t, "{oops")}, "parse JSON"},
		{"unknown subcommand", []string{"invoice", "frobnicate"}, "unknown invoice subcommand"},
		{"decode missing argument", []string{"invoice", "decode"}, ""},
		{"decode a pay code", []string{"invoice", "decode", "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"}, "Expected bysquareType 1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, stderr, exitCode := runCLI(t, tt.args, "")
			if exitCode == 0 || !strings.Contains(stderr, tt.want) {
				t.Errorf("exit %d, stderr %q, want %q", exitCode, stderr, tt.want)
			}
		})
	}
}

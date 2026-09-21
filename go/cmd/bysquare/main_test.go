package main

import (
	"bytes"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare/pay"
)

var exampleJSON = filepath.Join("..", "..", "..", "examples", "cli", "example.json")

// runCLI runs the command in-process the way main would, with stdin as its
// input, and returns what a shell would see.
func runCLI(t *testing.T, args []string, stdin string) (stdout, stderr string, exitCode int) {
	t.Helper()

	var out, errOut bytes.Buffer

	exitCode = run(args, streams{in: strings.NewReader(stdin), out: &out, err: &errOut})

	return strings.TrimSpace(out.String()), strings.TrimSpace(errOut.String()), exitCode
}

// discard is the I/O for a command whose output the test does not read.
func discard() streams { return streams{in: strings.NewReader(""), out: io.Discard, err: io.Discard} }

// capture runs one command function with stdin as its input and returns its
// stdout and error.
func capture(stdin string, fn func(s streams) error) (string, error) {
	var out, errOut bytes.Buffer

	err := fn(streams{in: strings.NewReader(stdin), out: &out, err: &errOut})

	return strings.TrimSpace(out.String()), err
}

func TestVersion(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"version"}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if !strings.Contains(stdout, "bysquare version") {
		t.Errorf("Expected version output, got: %s", stdout)
	}
}

func TestHelp(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"help"}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if !strings.Contains(stdout, "USAGE:") {
		t.Errorf("Expected help output, got: %s", stdout)
	}
}

func TestNoArguments(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "USAGE:") {
		t.Errorf("Expected usage in stderr, got: %s", stderr)
	}
}

func TestUnknownCommand(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"invalid"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "Unknown command: invalid") {
		t.Errorf("Expected unknown command error, got: %s", stderr)
	}
}

func TestPayEncodeDecodeRoundTrip(t *testing.T) {
	qrString, stderr, exitCode := runCLI(t, []string{"pay", "encode", exampleJSON}, "")
	if exitCode != 0 {
		t.Fatalf("Encode failed with exit code %d. Stderr: %s", exitCode, stderr)
	}

	stdout, stderr, exitCode := runCLI(t, []string{"pay", "decode", qrString}, "")
	if exitCode != 0 {
		t.Fatalf("Decode failed with exit code %d. Stderr: %s", exitCode, stderr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(stdout), &result); err != nil {
		t.Fatalf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}

	payments := result["payments"].([]interface{})
	if len(payments) != 1 {
		t.Errorf("Expected 1 payment, got: %d", len(payments))
	}

	payment := payments[0].(map[string]interface{})
	if payment["variableSymbol"] != "123" {
		t.Errorf("Expected variableSymbol '123', got: %v", payment["variableSymbol"])
	}
}

func TestPayEncodeInvalidJSON(t *testing.T) {
	input := []byte(`{invalid json}`)

	cfg := pay.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  0x02,
	}

	err := encodePayAndPrint(input, cfg, io.Discard)
	if err == nil {
		t.Error("Expected error for invalid JSON, got nil")
	}

	if !strings.Contains(err.Error(), "failed to parse JSON") {
		t.Errorf("Expected parse error, got: %v", err)
	}
}

func TestPayEncodeWithFlags(t *testing.T) {
	tmpfile, err := os.CreateTemp(t.TempDir(), "test*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Remove(tmpfile.Name()) }()

	content := `{
		"invoiceId": "test",
		"payments": [{
			"type": 1,
			"amount": 100,
			"bankAccounts": [{"iban": "SK9611000000002918599669"}],
			"currencyCode": "EUR",
			"beneficiary": {"name": "Test"}
		}]
	}`

	if _, err := tmpfile.WriteString(content); err != nil {
		t.Fatal(err)
	}

	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name   string
		args   []string
		prefix string
	}{
		{"version 1.0.0", []string{"-s", "1.0.0", tmpfile.Name()}, "00"},
		{"version 1.1.0", []string{"-s", "1.1.0", tmpfile.Name()}, "04"},
		{"version 1.2.0", []string{"-s", "1.2.0", tmpfile.Name()}, "08"},
		{"no-deburr", []string{"--no-deburr", tmpfile.Name()}, "08"},
		{"no-validate", []string{"--no-validate", tmpfile.Name()}, "08"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output, cmdErr := capture("", func(s streams) error { return cmdPayEncode(tt.args, s) })
			if cmdErr != nil {
				t.Errorf("cmdPayEncode(%v) failed: %v", tt.args, cmdErr)
			}

			if !strings.HasPrefix(output, tt.prefix) {
				t.Errorf("Expected prefix %s, got: %s", tt.prefix, output[:4])
			}
		})
	}
}

func TestPayEncodeInvalidVersion(t *testing.T) {
	err := cmdPayEncode([]string{"-s", "9.9.9", "dummy.json"}, discard())
	if err == nil {
		t.Error("Expected error for invalid version, got nil")
	}

	if !strings.Contains(err.Error(), "unsupported spec version") {
		t.Errorf("Expected unsupported version error, got: %v", err)
	}
}

func TestPayEncodeMissingFile(t *testing.T) {
	err := cmdPayEncode([]string{}, discard())
	if err == nil {
		t.Error("Expected error for missing file arg, got nil")
	}

	if !strings.Contains(err.Error(), "missing input file argument") {
		t.Errorf("Expected missing file error, got: %v", err)
	}
}

func TestPayEncodeFileNotFound(t *testing.T) {
	_, cmdErr := capture("", func(s streams) error { return cmdPayEncode([]string{"nonexistent.json"}, s) })
	if cmdErr == nil {
		t.Error("Expected error for missing file, got nil")
	}

	if !strings.Contains(cmdErr.Error(), "failed to read input") {
		t.Errorf("Expected read error, got: %v", cmdErr)
	}
}

func TestPayDecodeQRString(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	output, cmdErr := capture("", func(s streams) error { return cmdPayDecode([]string{qrString}, s) })
	if cmdErr != nil {
		t.Errorf("cmdPayDecode failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestPayDecodeFromFile(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	tmpfile, err := os.CreateTemp(t.TempDir(), "test-qr*.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Remove(tmpfile.Name()) }()

	if _, err := tmpfile.WriteString(qrString + "\n"); err != nil {
		t.Fatal(err)
	}

	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	output, cmdErr := capture("", func(s streams) error { return cmdPayDecode([]string{tmpfile.Name()}, s) })
	if cmdErr != nil {
		t.Errorf("cmdPayDecode from file failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestPayDecodeFromStdin(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	output, cmdErr := capture(qrString, func(s streams) error { return cmdPayDecode([]string{"-"}, s) })
	if cmdErr != nil {
		t.Errorf("cmdPayDecode stdin failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestPayDecodeMissingArg(t *testing.T) {
	err := cmdPayDecode([]string{}, discard())
	if err == nil {
		t.Error("Expected error for missing QR string, got nil")
	}

	if !strings.Contains(err.Error(), "missing QR string argument") {
		t.Errorf("Expected missing argument error, got: %v", err)
	}
}

func TestPayDecodeInvalidQR(t *testing.T) {
	err := cmdPayDecode([]string{"INVALIDQRSTRING"}, discard())
	if err == nil {
		t.Error("Expected error for invalid QR string, got nil")
	}

	if !strings.Contains(err.Error(), "decoding failed") {
		t.Errorf("Expected decoding error, got: %v", err)
	}
}

func TestPayProcessFileJSONL(t *testing.T) {
	tmpfile, err := os.CreateTemp(t.TempDir(), "test*.jsonl")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Remove(tmpfile.Name()) }()

	content := `{"invoiceId": "1", "payments": [{"type": 1, "amount": 100, "bankAccounts": [{"iban": "SK9611000000002918599669"}], "currencyCode": "EUR", "beneficiary": {"name": "Test"}}]}
{"invoiceId": "2", "payments": [{"type": 1, "amount": 200, "bankAccounts": [{"iban": "SK9611000000002918599669"}], "currencyCode": "EUR", "beneficiary": {"name": "Test"}}]}`

	if _, err := tmpfile.WriteString(content); err != nil {
		t.Fatal(err)
	}

	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	cfg := pay.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  0x02,
	}

	output, encErr := capture("", func(s streams) error { return processPayFile(tmpfile.Name(), cfg, s) })
	if encErr != nil {
		t.Errorf("processPayFile JSONL failed: %v", encErr)
	}

	lines := strings.Split(output, "\n")
	if len(lines) != 2 {
		t.Errorf("Expected 2 output lines, got %d", len(lines))
	}
}

func TestPayProcessFileFromStdin(t *testing.T) {
	content := `{
		"invoiceId": "stdin-test",
		"payments": [{
			"type": 1,
			"amount": 100,
			"bankAccounts": [{"iban": "SK9611000000002918599669"}],
			"currencyCode": "EUR",
			"beneficiary": {"name": "Test"}
		}]
	}`

	cfg := pay.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  0x02,
	}

	output, encErr := capture(content, func(s streams) error { return processPayFile("-", cfg, s) })
	if encErr != nil {
		t.Errorf("processPayFile stdin failed: %v", encErr)
	}

	if len(output) < 50 {
		t.Errorf("Output too short: %s", output)
	}
}

func TestPayEncodeValidationError(t *testing.T) {
	input := []byte(`{
		"invoiceId": "test",
		"payments": [{
			"type": 1,
			"amount": 100,
			"bankAccounts": [{"iban": "INVALID_IBAN"}],
			"currencyCode": "EUR",
			"beneficiary": {"name": "Test"}
		}]
	}`)

	cfg := pay.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  0x02,
	}

	err := encodePayAndPrint(input, cfg, io.Discard)
	if err == nil {
		t.Error("Expected validation error for invalid IBAN, got nil")
	}
}

func TestDecodeAutoDetect(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	output, cmdErr := capture("", func(s streams) error { return cmdDecodeAuto([]string{qrString}, s) })
	if cmdErr != nil {
		t.Errorf("cmdDecodeAuto failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestDecodeAutoMissingArg(t *testing.T) {
	err := cmdDecodeAuto([]string{}, discard())
	if err == nil {
		t.Error("Expected error for missing QR string, got nil")
	}

	if !strings.Contains(err.Error(), "missing QR string argument") {
		t.Errorf("Expected missing argument error, got: %v", err)
	}
}

func TestPayMissingSubcommand(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"pay"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "missing subcommand") {
		t.Errorf("Expected missing subcommand error, got: %s", stderr)
	}
}

func TestInvoiceMissingSubcommand(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"invoice"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "missing subcommand") {
		t.Errorf("Expected missing subcommand error, got: %s", stderr)
	}
}

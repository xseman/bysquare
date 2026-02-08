package main

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

var (
	binaryPath   string
	exampleJSON  string
	exampleJSONL string
)

func TestMain(m *testing.M) {
	// Build the binary before running tests
	binaryPath = filepath.Join(os.TempDir(), "bysquare-test")
	cmd := exec.Command("go", "build", "-o", binaryPath, ".")
	if err := cmd.Run(); err != nil {
		os.Exit(1)
	}
	defer func() { _ = os.Remove(binaryPath) }()

	// Set up example file paths
	exampleJSON = filepath.Join("..", "..", "..", "examples", "cli", "example.json")
	exampleJSONL = filepath.Join("..", "..", "..", "examples", "cli", "example.jsonl")

	os.Exit(m.Run())
}

// captureStdout runs fn while capturing stdout output.
func captureStdout(t *testing.T, fn func()) string {
	t.Helper()

	oldStdout := os.Stdout
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdout = w

	fn()

	_ = w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	_, _ = buf.ReadFrom(r)
	return strings.TrimSpace(buf.String())
}

func runCLI(t *testing.T, args []string, stdin string) (stdout, stderr string, exitCode int) {
	t.Helper()

	cmd := exec.Command(binaryPath, args...)
	if stdin != "" {
		cmd.Stdin = strings.NewReader(stdin)
	}

	var outBuf, errBuf strings.Builder
	cmd.Stdout = &outBuf
	cmd.Stderr = &errBuf

	err := cmd.Run()
	stdout = strings.TrimSpace(outBuf.String())
	stderr = strings.TrimSpace(errBuf.String())

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			t.Fatalf("Failed to run command: %v", err)
		}
	} else {
		exitCode = 0
	}

	return
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

// Integration test: verify end-to-end binary behavior
func TestEncodeDecodeRoundTrip(t *testing.T) {
	// Encode
	qrString, stderr, exitCode := runCLI(t, []string{"encode", exampleJSON}, "")
	if exitCode != 0 {
		t.Fatalf("Encode failed with exit code %d. Stderr: %s", exitCode, stderr)
	}

	// Decode
	stdout, stderr, exitCode := runCLI(t, []string{"decode", qrString}, "")
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

func TestEncodeAndPrint(t *testing.T) {
	input := []byte(`{
		"invoiceId": "test",
		"payments": [{
			"type": 1,
			"amount": 100,
			"bankAccounts": [{"iban": "SK9611000000002918599669"}],
			"currencyCode": "EUR",
			"beneficiary": {"name": "Test"}
		}]
	}`)

	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	var encErr error
	output := captureStdout(t, func() {
		encErr = encodeAndPrint(input, cfg)
	})

	if encErr != nil {
		t.Errorf("encodeAndPrint failed: %v", encErr)
	}

	if len(output) < 50 {
		t.Errorf("Output too short: %s", output)
	}

	if !strings.HasPrefix(output, "08") {
		t.Errorf("Expected version 1.2.0 prefix '08', got: %s", output[:2])
	}
}

func TestEncodeAndPrintInvalidJSON(t *testing.T) {
	input := []byte(`{invalid json}`)

	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	err := encodeAndPrint(input, cfg)
	if err == nil {
		t.Error("Expected error for invalid JSON, got nil")
	}

	if !strings.Contains(err.Error(), "failed to parse JSON") {
		t.Errorf("Expected parse error, got: %v", err)
	}
}

func TestCmdEncodeWithFile(t *testing.T) {
	tmpfile, err := os.CreateTemp("", "test*.json")
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

	if _, err := tmpfile.Write([]byte(content)); err != nil {
		t.Fatal(err)
	}
	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	var cmdErr error
	output := captureStdout(t, func() {
		cmdErr = cmdEncode([]string{tmpfile.Name()})
	})

	if cmdErr != nil {
		t.Errorf("cmdEncode failed: %v", cmdErr)
	}

	if len(output) < 50 {
		t.Errorf("Output too short: %s", output)
	}

	if !strings.HasPrefix(output, "08") {
		t.Errorf("Expected version 1.2.0 prefix, got: %s", output[:4])
	}
}

func TestCmdEncodeWithFlags(t *testing.T) {
	tmpfile, err := os.CreateTemp("", "test*.json")
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

	if _, err := tmpfile.Write([]byte(content)); err != nil {
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
			var cmdErr error
			output := captureStdout(t, func() {
				cmdErr = cmdEncode(tt.args)
			})

			if cmdErr != nil {
				t.Errorf("cmdEncode(%v) failed: %v", tt.args, cmdErr)
			}

			if !strings.HasPrefix(output, tt.prefix) {
				t.Errorf("Expected prefix %s, got: %s", tt.prefix, output[:4])
			}
		})
	}
}

func TestCmdEncodeInvalidVersion(t *testing.T) {
	err := cmdEncode([]string{"-s", "9.9.9", "dummy.json"})
	if err == nil {
		t.Error("Expected error for invalid version, got nil")
	}

	if !strings.Contains(err.Error(), "unsupported spec version") {
		t.Errorf("Expected unsupported version error, got: %v", err)
	}
}

func TestCmdEncodeMissingFile(t *testing.T) {
	err := cmdEncode([]string{})
	if err == nil {
		t.Error("Expected error for missing file arg, got nil")
	}

	if !strings.Contains(err.Error(), "missing input file argument") {
		t.Errorf("Expected missing file error, got: %v", err)
	}
}

func TestCmdEncodeFileNotFound(t *testing.T) {
	var cmdErr error
	_ = captureStdout(t, func() {
		cmdErr = cmdEncode([]string{"nonexistent.json"})
	})

	if cmdErr == nil {
		t.Error("Expected error for missing file, got nil")
	}

	if !strings.Contains(cmdErr.Error(), "failed to read input") {
		t.Errorf("Expected read error, got: %v", cmdErr)
	}
}

func TestCmdDecodeQRString(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	var cmdErr error
	output := captureStdout(t, func() {
		cmdErr = cmdDecode([]string{qrString})
	})

	if cmdErr != nil {
		t.Errorf("cmdDecode failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestCmdDecodeFromFile(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	tmpfile, err := os.CreateTemp("", "test-qr*.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Remove(tmpfile.Name()) }()

	if _, err := tmpfile.Write([]byte(qrString + "\n")); err != nil {
		t.Fatal(err)
	}
	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	var cmdErr error
	output := captureStdout(t, func() {
		cmdErr = cmdDecode([]string{tmpfile.Name()})
	})

	if cmdErr != nil {
		t.Errorf("cmdDecode from file failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestCmdDecodeFromStdin(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"

	oldStdin := os.Stdin
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdin = r

	go func() {
		_, _ = w.Write([]byte(qrString))
		_ = w.Close()
	}()

	var cmdErr error
	output := captureStdout(t, func() {
		cmdErr = cmdDecode([]string{"-"})
	})

	os.Stdin = oldStdin

	if cmdErr != nil {
		t.Errorf("cmdDecode stdin failed: %v", cmdErr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestCmdDecodeMissingArg(t *testing.T) {
	err := cmdDecode([]string{})
	if err == nil {
		t.Error("Expected error for missing QR string, got nil")
	}

	if !strings.Contains(err.Error(), "missing QR string argument") {
		t.Errorf("Expected missing argument error, got: %v", err)
	}
}

func TestCmdDecodeInvalidQR(t *testing.T) {
	err := cmdDecode([]string{"INVALIDQRSTRING"})
	if err == nil {
		t.Error("Expected error for invalid QR string, got nil")
	}

	if !strings.Contains(err.Error(), "decoding failed") {
		t.Errorf("Expected decoding error, got: %v", err)
	}
}

func TestProcessFileJSONL(t *testing.T) {
	tmpfile, err := os.CreateTemp("", "test*.jsonl")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Remove(tmpfile.Name()) }()

	content := `{"invoiceId": "1", "payments": [{"type": 1, "amount": 100, "bankAccounts": [{"iban": "SK9611000000002918599669"}], "currencyCode": "EUR", "beneficiary": {"name": "Test"}}]}
{"invoiceId": "2", "payments": [{"type": 1, "amount": 200, "bankAccounts": [{"iban": "SK9611000000002918599669"}], "currencyCode": "EUR", "beneficiary": {"name": "Test"}}]}`

	if _, err := tmpfile.Write([]byte(content)); err != nil {
		t.Fatal(err)
	}
	if err := tmpfile.Close(); err != nil {
		t.Fatal(err)
	}

	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	var encErr error
	output := captureStdout(t, func() {
		encErr = processFile(tmpfile.Name(), cfg)
	})

	if encErr != nil {
		t.Errorf("processFile JSONL failed: %v", encErr)
	}

	lines := strings.Split(output, "\n")
	if len(lines) != 2 {
		t.Errorf("Expected 2 output lines, got %d", len(lines))
	}
}

func TestProcessFileMissing(t *testing.T) {
	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	err := processFile("nonexistent.json", cfg)
	if err == nil {
		t.Error("Expected error for missing file, got nil")
	}

	if !strings.Contains(err.Error(), "failed to read input") {
		t.Errorf("Expected read error, got: %v", err)
	}
}

func TestProcessFileFromStdin(t *testing.T) {
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

	oldStdin := os.Stdin
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdin = r

	go func() {
		_, _ = w.Write([]byte(content))
		_ = w.Close()
	}()

	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	var encErr error
	output := captureStdout(t, func() {
		encErr = processFile("-", cfg)
	})

	os.Stdin = oldStdin

	if encErr != nil {
		t.Errorf("processFile stdin failed: %v", encErr)
	}

	if len(output) < 50 {
		t.Errorf("Output too short: %s", output)
	}
}

func TestEncodeAndPrintValidationError(t *testing.T) {
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

	cfg := bysquare.EncodeOptions{
		Deburr:   true,
		Validate: true,
		Version:  bysquare.Version120,
	}

	err := encodeAndPrint(input, cfg)
	if err == nil {
		t.Error("Expected validation error for invalid IBAN, got nil")
	}

	if !strings.Contains(err.Error(), "encoding failed") {
		t.Errorf("Expected encoding error, got: %v", err)
	}
}

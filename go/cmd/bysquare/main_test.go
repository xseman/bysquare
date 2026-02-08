package main

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

var (
	binaryPath  string
	exampleJSON string
	exampleJSONL string
)

func TestMain(m *testing.M) {
	// Build the binary before running tests
	binaryPath = filepath.Join(os.TempDir(), "bysquare-test")
	cmd := exec.Command("go", "build", "-o", binaryPath, ".")
	if err := cmd.Run(); err != nil {
		os.Exit(1)
	}
	defer os.Remove(binaryPath)

	// Set up example file paths
	exampleJSON = filepath.Join("..", "..", "..", "examples", "cli", "example.json")
	exampleJSONL = filepath.Join("..", "..", "..", "examples", "cli", "example.jsonl")

	os.Exit(m.Run())
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

func TestEncodeWithFile(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"encode", exampleJSON}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if len(stdout) < 50 {
		t.Errorf("Expected QR string, got: %s", stdout)
	}

	// Check base32hex characters
	for _, c := range stdout {
		if !((c >= '0' && c <= '9') || (c >= 'A' && c <= 'V')) {
			t.Errorf("Invalid base32hex character in output: %c", c)
		}
	}
}

func TestEncodeWithJSONL(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"encode", exampleJSONL}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	lines := strings.Split(stdout, "\n")
	if len(lines) != 2 {
		t.Errorf("Expected 2 QR strings for JSONL, got %d", len(lines))
	}
}

func TestEncodeFromStdin(t *testing.T) {
	input := `{
		"invoiceId": "test",
		"payments": [{
			"type": 1,
			"amount": 100,
			"bankAccounts": [{"iban": "SK9611000000002918599669"}],
			"currencyCode": "EUR",
			"beneficiary": {"name": "Test"}
		}]
	}`

	stdout, stderr, exitCode := runCLI(t, []string{"encode", "-"}, input)

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if len(stdout) < 50 {
		t.Errorf("Expected QR string, got: %s", stdout)
	}
}

func TestEncodeWithSpecVersion(t *testing.T) {
	tests := []struct {
		version string
		prefix  string
	}{
		{"1.0.0", "00"},
		{"1.1.0", "04"},
		{"1.2.0", "08"},
	}

	for _, tt := range tests {
		t.Run(tt.version, func(t *testing.T) {
			stdout, stderr, exitCode := runCLI(t, []string{"encode", "-s", tt.version, exampleJSON}, "")

			if exitCode != 0 {
				t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
			}

			if !strings.HasPrefix(stdout, tt.prefix) {
				t.Errorf("Expected prefix %s for version %s, got: %s", tt.prefix, tt.version, stdout[:4])
			}
		})
	}
}

func TestEncodeWithInvalidVersion(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"encode", "-s", "9.9.9", exampleJSON}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "unsupported spec version") {
		t.Errorf("Expected unsupported version error, got: %s", stderr)
	}
}

func TestEncodeWithNoDeburr(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"encode", "--no-deburr", exampleJSON}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if len(stdout) < 50 {
		t.Errorf("Expected QR string, got: %s", stdout)
	}
}

func TestEncodeWithNoValidate(t *testing.T) {
	stdout, stderr, exitCode := runCLI(t, []string{"encode", "--no-validate", exampleJSON}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	if len(stdout) < 50 {
		t.Errorf("Expected QR string, got: %s", stdout)
	}
}

func TestEncodeWithMissingFile(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"encode", "nonexistent.json"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "failed to read input") {
		t.Errorf("Expected file read error, got: %s", stderr)
	}
}

func TestEncodeWithNoFileArgument(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"encode"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "missing input file argument") {
		t.Errorf("Expected missing file error, got: %s", stderr)
	}
}

func TestDecodeQRString(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"
	stdout, stderr, exitCode := runCLI(t, []string{"decode", qrString}, "")

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(stdout), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestDecodeFromStdin(t *testing.T) {
	qrString := "0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5K2BATU8DV6PA0G2P9U05QCF640MRVMTLLI3OJ8CEGOUEP5GR3LIJ4C0A8ERUI3JHM3VTNG00"
	stdout, stderr, exitCode := runCLI(t, []string{"decode", "-"}, qrString)

	if exitCode != 0 {
		t.Errorf("Expected exit code 0, got %d. Stderr: %s", exitCode, stderr)
	}

	var result map[string]interface{}
	if err := json.Unmarshal([]byte(stdout), &result); err != nil {
		t.Errorf("Failed to parse JSON output: %v", err)
	}

	if result["invoiceId"] != "random-id" {
		t.Errorf("Expected invoiceId 'random-id', got: %v", result["invoiceId"])
	}
}

func TestDecodeWithNoArgument(t *testing.T) {
	_, stderr, exitCode := runCLI(t, []string{"decode"}, "")

	if exitCode != 1 {
		t.Errorf("Expected exit code 1, got %d", exitCode)
	}

	if !strings.Contains(stderr, "missing QR string argument") {
		t.Errorf("Expected missing argument error, got: %s", stderr)
	}
}

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

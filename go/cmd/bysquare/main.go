package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/invoice"
	"github.com/xseman/bysquare/go/pkg/bysquare/pay"
)

// version is set by ldflags at build time
var version = "dev"

const (
	usage = `bysquare - Slovak BySquare QR standard

USAGE:
    bysquare pay encode [OPTIONS] <input.json>
    bysquare pay decode <qr-string>
    bysquare invoice encode [OPTIONS] <input.json>
    bysquare invoice decode <qr-string>
    bysquare decode <qr-string>
    bysquare version

COMMANDS:
    pay          PAY by square operations
    invoice      Invoice by square operations
    decode       Auto-detect and decode any BySquare QR string
    version      Print version information

PAY ENCODE OPTIONS:
    -D, --no-deburr           Keep diacritics (deburr enabled by default)
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0, 1.1.0, 1.2.0 (default: 1.2.0)

INVOICE ENCODE OPTIONS:
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0 (default: 1.0.0)

EXAMPLES:
    # PAY: Encode with defaults
    $ bysquare pay encode payment.json

    # PAY: Encode from stdin
    $ echo '{"payments":[...]}' | bysquare pay encode -

    # PAY: Decode QR string
    $ bysquare pay decode "00D80..."

    # Invoice: Encode
    $ bysquare invoice encode invoice.json

    # Auto-detect and decode any BySquare QR
    $ bysquare decode "00D80..."

For more information, visit: https://github.com/xseman/bysquare
`
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprint(os.Stderr, usage)
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "pay":
		if err := cmdPay(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "invoice":
		if err := cmdInvoice(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "decode":
		if err := cmdDecodeAuto(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "version", "-v", "--version":
		fmt.Printf("bysquare version %s\n", version)
	case "help", "-h", "--help":
		fmt.Print(usage)
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n\n", command)
		fmt.Fprint(os.Stderr, usage)
		os.Exit(1)
	}
}

func cmdPay(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("missing subcommand: encode or decode")
	}

	switch args[0] {
	case "encode":
		return cmdPayEncode(args[1:])
	case "decode":
		return cmdPayDecode(args[1:])
	default:
		return fmt.Errorf("unknown pay subcommand: %s", args[0])
	}
}

func cmdPayEncode(args []string) error {
	fs := flag.NewFlagSet("pay encode", flag.ExitOnError)

	noDeburr := fs.Bool("no-deburr", false, "Keep diacritics")
	fs.BoolVar(noDeburr, "D", false, "Keep diacritics (shorthand)")

	noValidate := fs.Bool("no-validate", false, "Skip validation")
	fs.BoolVar(noValidate, "V", false, "Skip validation (shorthand)")

	specVersion := fs.String("spec-version", "1.2.0", "Specification version (1.0.0, 1.1.0, 1.2.0)")
	fs.StringVar(specVersion, "s", "1.2.0", "Specification version (shorthand)")

	if err := fs.Parse(args); err != nil {
		return err
	}

	positionals := fs.Args()
	if len(positionals) < 1 {
		return fmt.Errorf("missing input file argument")
	}

	ver, err := parseVersion(*specVersion)
	if err != nil {
		return err
	}

	cfg := pay.EncodeOptions{
		Deburr:   !*noDeburr,
		Validate: !*noValidate,
		Version:  ver,
	}

	for _, inputFile := range positionals {
		if err := processPayFile(inputFile, cfg); err != nil {
			return err
		}
	}

	return nil
}

func encodePayAndPrint(data []byte, cfg pay.EncodeOptions) error {
	var model pay.DataModel
	if err := json.Unmarshal(data, &model); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	qr, err := pay.Encode(model, cfg)
	if err != nil {
		return fmt.Errorf("encoding failed: %w", err)
	}

	fmt.Println(qr)
	return nil
}

func processPayFile(inputFile string, cfg pay.EncodeOptions) error {
	input, err := readInput(inputFile)
	if err != nil {
		return err
	}

	if strings.HasSuffix(inputFile, ".jsonl") {
		for _, line := range strings.Split(string(input), "\n") {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			if err := encodePayAndPrint([]byte(line), cfg); err != nil {
				return err
			}
		}
		return nil
	}

	return encodePayAndPrint(input, cfg)
}

func cmdPayDecode(args []string) error {
	qr, err := readQRInput(args)
	if err != nil {
		return err
	}

	model, err := pay.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	return printJSON(model)
}

func cmdInvoice(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("missing subcommand: encode or decode")
	}

	switch args[0] {
	case "encode":
		return cmdInvoiceEncode(args[1:])
	case "decode":
		return cmdInvoiceDecode(args[1:])
	default:
		return fmt.Errorf("unknown invoice subcommand: %s", args[0])
	}
}

func cmdInvoiceEncode(args []string) error {
	fs := flag.NewFlagSet("invoice encode", flag.ExitOnError)

	noValidate := fs.Bool("no-validate", false, "Skip validation")
	fs.BoolVar(noValidate, "V", false, "Skip validation (shorthand)")

	specVersion := fs.String("spec-version", "1.0.0", "Specification version (1.0.0)")
	fs.StringVar(specVersion, "s", "1.0.0", "Specification version (shorthand)")

	if err := fs.Parse(args); err != nil {
		return err
	}

	positionals := fs.Args()
	if len(positionals) < 1 {
		return fmt.Errorf("missing input file argument")
	}

	ver, err := parseVersion(*specVersion)
	if err != nil {
		return err
	}

	cfg := invoice.EncodeOptions{
		Validate: !*noValidate,
		Version:  ver,
	}

	for _, inputFile := range positionals {
		input, err := readInput(inputFile)
		if err != nil {
			return err
		}

		var model invoice.DataModel
		if err := json.Unmarshal(input, &model); err != nil {
			return fmt.Errorf("failed to parse JSON: %w", err)
		}

		qr, err := invoice.Encode(&model, cfg)
		if err != nil {
			return fmt.Errorf("encoding failed: %w", err)
		}

		fmt.Println(qr)
	}

	return nil
}

func cmdInvoiceDecode(args []string) error {
	qr, err := readQRInput(args)
	if err != nil {
		return err
	}

	model, err := invoice.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	return printJSON(model)
}

// cmdDecodeAuto auto-detects the BySquare type from the header and decodes.
func cmdDecodeAuto(args []string) error {
	qr, err := readQRInput(args)
	if err != nil {
		return err
	}

	rawBytes, err := bysquare.DecodeBase32Hex(qr, true)
	if err != nil {
		return fmt.Errorf("decoding failed: invalid base32hex: %w", err)
	}

	if len(rawBytes) < 2 {
		return fmt.Errorf("decoding failed: input too short")
	}

	header := bysquare.ParseBysquareHeader(rawBytes[:2])

	switch header.BySquareType {
	case 0x00:
		model, err := pay.Decode(qr)
		if err != nil {
			return fmt.Errorf("decoding failed: %w", err)
		}
		return printJSON(model)
	case 0x01:
		model, err := invoice.Decode(qr)
		if err != nil {
			return fmt.Errorf("decoding failed: %w", err)
		}
		return printJSON(model)
	default:
		return fmt.Errorf("unsupported bysquareType: %d", header.BySquareType)
	}
}

// readInput reads file contents or stdin.
func readInput(path string) ([]byte, error) {
	if path == "-" {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			return nil, fmt.Errorf("failed to read stdin: %w", err)
		}
		return data, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read input: %w", err)
	}
	return data, nil
}

// readQRInput extracts a QR string from args (literal, file, or stdin).
func readQRInput(args []string) (string, error) {
	if len(args) < 1 {
		return "", fmt.Errorf("missing QR string argument")
	}

	qrInput := args[0]

	if qrInput == "-" {
		input, err := io.ReadAll(os.Stdin)
		if err != nil {
			return "", fmt.Errorf("failed to read stdin: %w", err)
		}
		return strings.TrimSpace(string(input)), nil
	}

	if fileInfo, err := os.Stat(qrInput); err == nil && !fileInfo.IsDir() {
		content, err := os.ReadFile(qrInput)
		if err != nil {
			return "", fmt.Errorf("failed to read file: %w", err)
		}
		return strings.TrimSpace(string(content)), nil
	}

	return qrInput, nil
}

func parseVersion(s string) (bysquare.Version, error) {
	switch s {
	case "1.0.0":
		return bysquare.Version100, nil
	case "1.1.0":
		return bysquare.Version110, nil
	case "1.2.0":
		return bysquare.Version120, nil
	default:
		return 0, fmt.Errorf("unsupported spec version: %s (use 1.0.0, 1.1.0, or 1.2.0)", s)
	}
}

func printJSON(v interface{}) error {
	output, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}
	fmt.Println(string(output))
	return nil
}

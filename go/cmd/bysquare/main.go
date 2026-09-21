// Command bysquare encodes and decodes the Slovak PAY by square and
// Invoice by square QR payloads.
package main

import (
	"encoding/json"
	"errors"
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

// streams is the process I/O a command reads and writes, so a test can hand
// in buffers instead of the real ones.
type streams struct {
	in       io.Reader
	out, err io.Writer
}

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
	os.Exit(run(os.Args[1:], streams{in: os.Stdin, out: os.Stdout, err: os.Stderr}))
}

// run is main without the process: arguments in, output and exit code out.
func run(args []string, s streams) int {
	if len(args) < 1 {
		fmt.Fprint(s.err, usage)
		return 1
	}

	var err error

	switch args[0] {
	case "pay":
		err = cmdPay(args[1:], s)
	case "invoice":
		err = cmdInvoice(args[1:], s)
	case "decode":
		err = cmdDecodeAuto(args[1:], s)
	case "version", "-v", "--version":
		fmt.Fprintf(s.out, "bysquare version %s\n", version)
	case "help", "-h", "--help":
		fmt.Fprint(s.out, usage)
	default:
		fmt.Fprintf(s.err, "Unknown command: %s\n\n%s", args[0], usage)
		return 1
	}

	if err != nil {
		fmt.Fprintf(s.err, "Error: %v\n", err)
		return 1
	}

	return 0
}

func cmdPay(args []string, s streams) error {
	if len(args) < 1 {
		return errors.New("missing subcommand: encode or decode")
	}

	switch args[0] {
	case "encode":
		return cmdPayEncode(args[1:], s)
	case "decode":
		return cmdPayDecode(args[1:], s)
	default:
		return fmt.Errorf("unknown pay subcommand: %s", args[0])
	}
}

func cmdPayEncode(args []string, s streams) error {
	fs := flag.NewFlagSet("pay encode", flag.ContinueOnError)
	fs.SetOutput(s.err)

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
		return errors.New("missing input file argument")
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
		if err := processPayFile(inputFile, cfg, s); err != nil {
			return err
		}
	}

	return nil
}

func encodePayAndPrint(data []byte, cfg pay.EncodeOptions, out io.Writer) error {
	var model pay.DataModel
	if err := json.Unmarshal(data, &model); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	qr, err := pay.Encode(model, cfg)
	if err != nil {
		return fmt.Errorf("encoding failed: %w", err)
	}

	fmt.Fprintln(out, qr)

	return nil
}

func processPayFile(inputFile string, cfg pay.EncodeOptions, s streams) error {
	input, err := readInput(inputFile, s.in)
	if err != nil {
		return err
	}

	if strings.HasSuffix(inputFile, ".jsonl") {
		for _, line := range strings.Split(string(input), "\n") {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			if err := encodePayAndPrint([]byte(line), cfg, s.out); err != nil {
				return err
			}
		}

		return nil
	}

	return encodePayAndPrint(input, cfg, s.out)
}

func cmdPayDecode(args []string, s streams) error {
	qr, err := readQRInput(args, s.in)
	if err != nil {
		return err
	}

	model, err := pay.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	return printJSON(model, s.out)
}

func cmdInvoice(args []string, s streams) error {
	if len(args) < 1 {
		return errors.New("missing subcommand: encode or decode")
	}

	switch args[0] {
	case "encode":
		return cmdInvoiceEncode(args[1:], s)
	case "decode":
		return cmdInvoiceDecode(args[1:], s)
	default:
		return fmt.Errorf("unknown invoice subcommand: %s", args[0])
	}
}

func cmdInvoiceEncode(args []string, s streams) error {
	fs := flag.NewFlagSet("invoice encode", flag.ContinueOnError)
	fs.SetOutput(s.err)

	noValidate := fs.Bool("no-validate", false, "Skip validation")
	fs.BoolVar(noValidate, "V", false, "Skip validation (shorthand)")

	specVersion := fs.String("spec-version", "1.0.0", "Specification version (1.0.0)")
	fs.StringVar(specVersion, "s", "1.0.0", "Specification version (shorthand)")

	if err := fs.Parse(args); err != nil {
		return err
	}

	positionals := fs.Args()
	if len(positionals) < 1 {
		return errors.New("missing input file argument")
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
		input, err := readInput(inputFile, s.in)
		if err != nil {
			return err
		}

		var model invoice.DataModel
		if err := json.Unmarshal(input, &model); err != nil {
			return fmt.Errorf("failed to parse JSON: %w", err)
		}

		qr, err := invoice.Encode(model, cfg)
		if err != nil {
			return fmt.Errorf("encoding failed: %w", err)
		}

		fmt.Fprintln(s.out, qr)
	}

	return nil
}

func cmdInvoiceDecode(args []string, s streams) error {
	qr, err := readQRInput(args, s.in)
	if err != nil {
		return err
	}

	model, err := invoice.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	return printJSON(model, s.out)
}

// cmdDecodeAuto auto-detects the BySquare type from the header and decodes.
func cmdDecodeAuto(args []string, s streams) error {
	qr, err := readQRInput(args, s.in)
	if err != nil {
		return err
	}

	rawBytes, err := bysquare.DecodeBase32Hex(qr, true)
	if err != nil {
		return fmt.Errorf("decoding failed: invalid base32hex: %w", err)
	}

	header := bysquare.DecodeHeader(rawBytes)

	switch header.BysquareType {
	case 0x00:
		model, err := pay.Decode(qr)
		if err != nil {
			return fmt.Errorf("decoding failed: %w", err)
		}

		return printJSON(model, s.out)

	case 0x01:
		model, err := invoice.Decode(qr)
		if err != nil {
			return fmt.Errorf("decoding failed: %w", err)
		}

		return printJSON(model, s.out)

	default:
		return fmt.Errorf("unsupported bysquareType: %d", header.BysquareType)
	}
}

// readInput reads file contents or stdin.
func readInput(path string, in io.Reader) ([]byte, error) {
	if path == "-" {
		data, err := io.ReadAll(in)
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
func readQRInput(args []string, in io.Reader) (string, error) {
	if len(args) < 1 {
		return "", errors.New("missing QR string argument")
	}

	qrInput := args[0]

	if qrInput == "-" {
		input, err := io.ReadAll(in)
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

func printJSON(v any, out io.Writer) error {
	output, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Fprintln(out, string(output))

	return nil
}

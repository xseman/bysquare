package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

// version is set by ldflags at build time
var version = "dev"

const (
	usage = `bysquare - Slovak PAY by square QR payment standard

USAGE:
    bysquare encode [OPTIONS] <input.json>
    bysquare decode <qr-string>
    bysquare version

COMMANDS:
    encode    Encode JSON payment data to BySquare QR string
    decode    Decode BySquare QR string to JSON payment data
    version   Print version information

ENCODE OPTIONS:
    -D, --no-deburr           Keep diacritics (deburr enabled by default)
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0, 1.1.0, 1.2.0 (default: 1.2.0)

EXAMPLES:
    # Encode with defaults (deburr=true, validate=true, version=1.2.0)
    $ bysquare encode payment.json

    # Encode with specific options
    $ bysquare encode --no-deburr payment.json
    $ bysquare encode --spec-version 1.1.0 payment.json
    $ bysquare encode -s 1.0.0 --no-validate payment.json

    # Encode from stdin
    $ echo '{"payments":[...]}' | bysquare encode -

    # Encode multiple files (including JSONL)
    $ bysquare encode file1.json file2.jsonl

    # Decode QR string
    $ bysquare decode "00D80..."

    # Decode from file
    $ bysquare decode qr.txt

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
	case "encode":
		if err := cmdEncode(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "decode":
		if err := cmdDecode(os.Args[2:]); err != nil {
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

func cmdEncode(args []string) error {
	fs := flag.NewFlagSet("encode", flag.ExitOnError)

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

	var ver bysquare.Version
	switch *specVersion {
	case "1.0.0":
		ver = bysquare.Version100
	case "1.1.0":
		ver = bysquare.Version110
	case "1.2.0":
		ver = bysquare.Version120
	default:
		return fmt.Errorf("unsupported spec version: %s (use 1.0.0, 1.1.0, or 1.2.0)", *specVersion)
	}

	cfg := bysquare.EncodeOptions{
		Deburr:   !*noDeburr,
		Validate: !*noValidate,
		Version:  ver,
	}

	for _, inputFile := range positionals {
		if err := processFile(inputFile, cfg); err != nil {
			return err
		}
	}

	return nil
}

func encodeAndPrint(data []byte, cfg bysquare.EncodeOptions) error {
	var model bysquare.DataModel
	if err := json.Unmarshal(data, &model); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	qr, err := bysquare.Encode(model, cfg)
	if err != nil {
		return fmt.Errorf("encoding failed: %w", err)
	}

	fmt.Println(qr)
	return nil
}

func processFile(inputFile string, cfg bysquare.EncodeOptions) error {
	var input []byte
	var err error

	if inputFile == "-" {
		input, err = io.ReadAll(os.Stdin)
	} else {
		input, err = os.ReadFile(inputFile)
	}
	if err != nil {
		return fmt.Errorf("failed to read input: %w", err)
	}

	if strings.HasSuffix(inputFile, ".jsonl") {
		for _, line := range strings.Split(string(input), "\n") {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			if err := encodeAndPrint([]byte(line), cfg); err != nil {
				return err
			}
		}
		return nil
	}

	return encodeAndPrint(input, cfg)
}

func cmdDecode(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("missing QR string argument")
	}

	qrInput := args[0]

	var qr string
	if qrInput == "-" {
		input, err := io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("failed to read stdin: %w", err)
		}
		qr = strings.TrimSpace(string(input))
	} else if fileInfo, err := os.Stat(qrInput); err == nil && !fileInfo.IsDir() {
		content, err := os.ReadFile(qrInput)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		qr = strings.TrimSpace(string(content))
	} else {
		qr = qrInput
	}

	model, err := bysquare.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	output, err := json.MarshalIndent(model, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(output))
	return nil
}

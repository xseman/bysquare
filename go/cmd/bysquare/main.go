package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

const (
	version = "0.1.0"
	usage   = `bysquare - Slovak PAY by square QR payment standard

USAGE:
    bysquare encode <input.json>
    bysquare decode <qr-string>
    bysquare version

COMMANDS:
    encode    Encode JSON payment data to BySquare QR string
    decode    Decode BySquare QR string to JSON payment data
    version   Print version information

EXAMPLES:
    # Encode payment data from JSON file
    $ bysquare encode payment.json
    
    # Encode from stdin
    $ echo '{"payments":[...]}' | bysquare encode -
    
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
		if err := cmdEncode(); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
	case "decode":
		if err := cmdDecode(); err != nil {
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

func cmdEncode() error {
	if len(os.Args) < 3 {
		return fmt.Errorf("missing input file argument")
	}

	inputFile := os.Args[2]

	// Read input
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

	// Parse JSON
	var model bysquare.DataModel
	if err := json.Unmarshal(input, &model); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	// Encode
	qr, err := bysquare.Encode(model)
	if err != nil {
		return fmt.Errorf("encoding failed: %w", err)
	}

	// Output
	fmt.Println(qr)
	return nil
}

func cmdDecode() error {
	if len(os.Args) < 3 {
		return fmt.Errorf("missing QR string argument")
	}

	qrInput := os.Args[2]

	// Read QR string
	var qr string
	if qrInput == "-" {
		input, err := io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("failed to read stdin: %w", err)
		}
		qr = string(input)
	} else if fileInfo, err := os.Stat(qrInput); err == nil && !fileInfo.IsDir() {
		content, err := os.ReadFile(qrInput)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		qr = string(content)
	} else {
		qr = qrInput
	}

	// Decode
	model, err := bysquare.Decode(qr)
	if err != nil {
		return fmt.Errorf("decoding failed: %w", err)
	}

	// Output JSON
	output, err := json.MarshalIndent(model, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(output))
	return nil
}

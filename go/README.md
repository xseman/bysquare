<h1 align="center">bysquare</h1>

<p align="center">
	"PAY by square" is a national standard for QR code payments that was adopted by
	the Slovak Banking Association in 2013. It is incorporated into a variety of
	invoices, reminders and other payment regulations.
</p>

<p align="center">
	<a href="#features">Features</a> •
	<a href="#installation">Installation</a> •
	<a href="#usage">Usage</a> •
	<a href="#cli">CLI</a> •
	<a href="#ffi-usage">FFI</a>
</p>

## Features

- CLI tooling
- Compatible with Slovak banking apps
- C-compatible FFI for Java, PHP, Python and other languages

> [!NOTE]
> Implementation are based on TypeScript version which since v3 is considered
> stable and specification-complete.\
> The Go version is still pre-v1, so limited breaking changes may occur as the
> API stabilizes. Only necessary adjustments and bug fixes will be introduced.

## Installation

### Module

```bash
go get github.com/xseman/bysquare/go@latest
```

### CLI

```bash
go install github.com/xseman/bysquare/go/cmd/bysquare@latest
```

Or download pre-built binaries from [GitHub Releases](https://github.com/xseman/bysquare/releases):

```bash
# Linux AMD64
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare-linux-amd64
chmod +x bysquare-linux-amd64
sudo mv bysquare-linux-amd64 /usr/local/bin/bysquare

# macOS ARM64
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare-darwin-arm64
chmod +x bysquare-darwin-arm64
sudo mv bysquare-darwin-arm64 /usr/local/bin/bysquare

# Windows AMD64
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare-windows-amd64.exe
```

### FFI Shared Library

Download platform-specific shared libraries from [GitHub Releases](https://github.com/xseman/bysquare/releases):

```bash
# Linux
curl -LO https://github.com/xseman/bysquare/releases/latest/download/libbysquare-linux-amd64.so

# macOS
curl -LO https://github.com/xseman/bysquare/releases/latest/download/libbysquare-darwin-arm64.dylib

# Windows
$url = "https://github.com/xseman/bysquare/releases/" +
  "latest/download/libbysquare-windows-amd64.dll"
Invoke-WebRequest -Uri $url -OutFile "libbysquare.dll"
```

## Usage

See [`pkg/bysquare/types.go`](pkg/bysquare/types.go) for complete type definitions.

### Library

```go
package main

import (
	"fmt"
	"log"

	"github.com/xseman/bysquare/go/pkg/bysquare"
)

func main() {
	// Create payment data
	payment := bysquare.DataModel{
		Payments: []bysquare.SimplePayment{
			{
				Type:           bysquare.PaymentTypePaymentOrder,
				Amount:         123.45,
				CurrencyCode:   bysquare.CurrencyEUR,
				VariableSymbol: "987654",
				Beneficiary: &bysquare.Beneficiary{Name: "John Doe"},
				BankAccounts: []bysquare.BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
			},
		},
	}

	// Encode to QR string
	qr, err := bysquare.Encode(payment)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("QR String: %s\n", qr)

	// Decode QR string
	decoded, err := bysquare.Decode(qr)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Amount: %.2f %s\n", decoded.Payments[0].Amount, decoded.Payments[0].CurrencyCode)
}
```

### CLI

#### Encode

Encode JSON or JSONL data from files and print the corresponding QR code.

```bash
bysquare encode payment.json
bysquare encode file1.json file2.json...
bysquare encode file.jsonl
```

Encode from stdin:

```bash
echo '{"payments":[{"type":1,"amount":123.45,"currencyCode":"EUR","bankAccounts":[{"iban":"SK9611000000002918599669"}],"beneficiary":{"name":"John Doe"}}]}' | bysquare encode -
```

#### Decode

Decode the specified QR code string and print the corresponding JSON data. The
qrstring argument should be a valid QR code string.

```bash
bysquare decode "00D80..."
bysquare decode qr.txt
```

### FFI Usage

**C Function Signatures:**

```c
// Encode payment data (JSON) to QR string
char* bysquare_encode(char* jsonData);

// Decode QR string to payment data (JSON)
char* bysquare_decode(char* qrString);

// Free memory allocated by library
void bysquare_free(char* ptr);

// Get library version
char* bysquare_version();
```

**Memory Management:**

Always call `bysquare_free()` on returned strings to prevent memory leaks:

```python
result = lib.bysquare_encode(data)
# Use result...
lib.bysquare_free(result)  # Important!
```

See detailed examples in [`../examples/ffi/`](../examples/ffi/):

- **Python**: [`../examples/ffi/python/example.py`](../examples/ffi/python/example.py)
- **PHP**: [`../examples/ffi/php/example.php`](../examples/ffi/php/example.php)
- **Java**: [`../examples/ffi/java/Example.java`](../examples/ffi/java/Example.java)
- **Swift**: [`../examples/ffi/swift/Example.swift`](../examples/ffi/swift/Example.swift)

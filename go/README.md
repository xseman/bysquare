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

- PAY by square encoding and decoding
- Invoice by square encoding and decoding
- Auto-detection of BySquare type from QR data
- CLI tooling with pay and invoice subcommands
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

#### Debian/Ubuntu (.deb)

```bash
# AMD64
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare_0.1.0_amd64.deb
sudo dpkg -i bysquare_0.1.0_amd64.deb

# ARM64
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare_0.1.0_arm64.deb
sudo dpkg -i bysquare_0.1.0_arm64.deb
```

#### RHEL/Fedora/CentOS (.rpm)

```bash
# AMD64 (x86_64)
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare-0.1.0-1.x86_64.rpm
sudo rpm -i bysquare-0.1.0-1.x86_64.rpm

# ARM64 (aarch64)
curl -LO https://github.com/xseman/bysquare/releases/latest/download/bysquare-0.1.0-1.aarch64.rpm
sudo rpm -i bysquare-0.1.0-1.aarch64.rpm
```

#### Standalone Binaries

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

See [`pkg/bysquare/pay/types.go`](pkg/bysquare/pay/types.go) and
[`pkg/bysquare/invoice/types.go`](pkg/bysquare/invoice/types.go) for complete
type definitions.

### Library

#### PAY by square

```go
package main

import (
	"fmt"
	"log"

	"github.com/xseman/bysquare/go/pkg/bysquare/pay"
)

func main() {
	// Create payment data
	payment := pay.DataModel{
		Payments: []pay.SimplePayment{
			{
				Type:           pay.PaymentTypePaymentOrder,
				Amount:         123.45,
				CurrencyCode:   pay.CurrencyEUR,
				VariableSymbol: "987654",
				Beneficiary:    &pay.Beneficiary{Name: "John Doe"},
				BankAccounts: []pay.BankAccount{
					{IBAN: "SK9611000000002918599669"},
				},
			},
		},
	}

	// Encode to QR string
	qr, err := pay.Encode(payment)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("QR String: %s\n", qr)

	// Decode QR string
	decoded, err := pay.Decode(qr)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Amount: %.2f %s\n", decoded.Payments[0].Amount, decoded.Payments[0].CurrencyCode)
}
```

#### Invoice by square

```go
package main

import (
	"fmt"
	"log"

	"github.com/xseman/bysquare/go/pkg/bysquare/invoice"
)

func main() {
	numLines := 5
	model := invoice.DataModel{
		DocumentType:      invoice.InvoiceDocumentTypeInvoice,
		InvoiceID:         "INV-2025-001",
		IssueDate:         "20250101",
		LocalCurrencyCode: "EUR",
		SupplierParty: invoice.SupplierParty{
			Party: invoice.Party{PartyName: "Supplier s.r.o."},
			PostalAddress: invoice.PostalAddress{
				StreetName: "Main Street 1",
				CityName:   "Bratislava",
				PostalZone: "81101",
				Country:    "SVK",
			},
		},
		CustomerParty: invoice.CustomerParty{
			Party: invoice.Party{PartyName: "Customer a.s."},
		},
		NumberOfInvoiceLines: &numLines,
		TaxCategorySummaries: []invoice.TaxCategorySummary{
			{
				ClassifiedTaxCategory: 0.2,
				TaxExclusiveAmount:    1000,
				TaxAmount:             200,
			},
		},
		MonetarySummary: invoice.MonetarySummary{},
	}

	qr, err := invoice.Encode(&model)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("QR String: %s\n", qr)
}
```

### CLI

#### PAY Encode

Encode JSON or JSONL data from files and print the corresponding QR code.

```bash
bysquare pay encode payment.json
bysquare pay encode file1.json file2.json...
bysquare pay encode file.jsonl
```

Encode from stdin:

```bash
echo '{"payments":[{"type":1,"amount":123.45,"currencyCode":"EUR","bankAccounts":[{"iban":"SK9611000000002918599669"}],"beneficiary":{"name":"John Doe"}}]}' | bysquare pay encode -
```

#### PAY Decode

Decode the specified QR code string and print the corresponding JSON data.

```bash
bysquare pay decode "00D80..."
bysquare pay decode qr.txt
```

#### Invoice Encode

```bash
bysquare invoice encode invoice.json
```

#### Invoice Decode

```bash
bysquare invoice decode "10D80..."
```

#### Auto-detect Decode

Automatically detects the BySquare type (PAY or Invoice) from the header and
decodes accordingly.

```bash
bysquare decode "00D80..."
```

### FFI Usage

**C Function Signatures:**

```c
// PAY by square
char* bysquare_pay_encode(char* jsonData);
char* bysquare_pay_decode(char* qrString);

// Invoice by square
char* bysquare_invoice_encode(char* jsonData);
char* bysquare_invoice_decode(char* qrString);

// Auto-detect type from QR header (returns 0=pay, 1=invoice, -1=error)
int bysquare_detect_type(char* qrString);

// Free memory allocated by library
void bysquare_free(char* ptr);

// Get library version
char* bysquare_version();
```

**Memory Management:**

Always call `bysquare_free()` on returned strings to prevent memory leaks:

```python
result = lib.bysquare_pay_encode(data)
# Use result...
lib.bysquare_free(result)  # Important!
```

See detailed examples in [`../examples/ffi/`](../examples/ffi/):

- **Python**: [`../examples/ffi/python/example.py`](../examples/ffi/python/example.py)
- **PHP**: [`../examples/ffi/php/example.php`](../examples/ffi/php/example.php)
- **Java**: [`../examples/ffi/java/Example.java`](../examples/ffi/java/Example.java)
- **Swift**: [`../examples/ffi/swift/Example.swift`](../examples/ffi/swift/Example.swift)

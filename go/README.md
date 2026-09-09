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

Or download pre-built binaries from [GitHub Releases](https://github.com/xseman/bysquare/releases).

> [!NOTE]
> Go and TypeScript are released independently from this repository, so
> `releases/latest` may point at a TypeScript release with no Go assets.
> Set `VERSION` to the Go release you want and use the tagged URL below.

#### Debian/Ubuntu (.deb)

```bash
VERSION=0.4.0
BASE=https://github.com/xseman/bysquare/releases/download/go/v${VERSION}

# AMD64
curl -LO ${BASE}/bysquare_${VERSION}_amd64.deb
sudo dpkg -i bysquare_${VERSION}_amd64.deb

# ARM64
curl -LO ${BASE}/bysquare_${VERSION}_arm64.deb
sudo dpkg -i bysquare_${VERSION}_arm64.deb
```

#### RHEL/Fedora/CentOS (.rpm)

```bash
VERSION=0.4.0
BASE=https://github.com/xseman/bysquare/releases/download/go/v${VERSION}

# AMD64 (x86_64)
curl -LO ${BASE}/bysquare-${VERSION}-1.x86_64.rpm
sudo rpm -i bysquare-${VERSION}-1.x86_64.rpm

# ARM64 (aarch64)
curl -LO ${BASE}/bysquare-${VERSION}-1.aarch64.rpm
sudo rpm -i bysquare-${VERSION}-1.aarch64.rpm
```

#### Standalone Binaries

```bash
BASE=https://github.com/xseman/bysquare/releases/download/go/v0.4.0

# Linux AMD64
curl -LO ${BASE}/bysquare-linux-amd64
chmod +x bysquare-linux-amd64
sudo mv bysquare-linux-amd64 /usr/local/bin/bysquare

# macOS ARM64
curl -LO ${BASE}/bysquare-darwin-arm64
chmod +x bysquare-darwin-arm64
sudo mv bysquare-darwin-arm64 /usr/local/bin/bysquare

# Windows AMD64
curl -LO ${BASE}/bysquare-windows-amd64.exe
```

### FFI Shared Library

Download platform-specific shared libraries from [GitHub Releases](https://github.com/xseman/bysquare/releases).
Each library ships with a matching C header (`libbysquare-<os>-<arch>.h`).

```bash
BASE=https://github.com/xseman/bysquare/releases/download/go/v0.4.0

# Linux
curl -LO ${BASE}/libbysquare-linux-amd64.so
curl -LO ${BASE}/libbysquare-linux-amd64.h

# macOS
curl -LO ${BASE}/libbysquare-darwin-arm64.dylib
curl -LO ${BASE}/libbysquare-darwin-arm64.h
```

```powershell
# Windows
$base = "https://github.com/xseman/bysquare/releases/download/go/v0.4.0"
Invoke-WebRequest -Uri "$base/libbysquare-windows-amd64.dll" -OutFile "libbysquare.dll"
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
// config: bitflags, or -1 for defaults (deburr + validate + v1.2.0)
char* bysquare_pay_encode(char* jsonData, int config);
char* bysquare_pay_decode(char* qrString);

// Invoice by square
// config: bitflags, or -1 for defaults (validate + v1.0.0, no deburr)
char* bysquare_invoice_encode(char* jsonData, int config);
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

- **Java**: [`../examples/ffi/java/`](../examples/ffi/java/)
- **C#**: [`../examples/ffi/csharp/`](../examples/ffi/csharp/)
- **PHP**: [`../examples/ffi/php/`](../examples/ffi/php/)
- **Python**: [`../examples/ffi/python/`](../examples/ffi/python/)
- **Swift**: [`../examples/ffi/swift/`](../examples/ffi/swift/)
- **Dart**: [`../examples/ffi/dart/`](../examples/ffi/dart/)

# Foreign Function Interface (FFI)

C-compatible FFI layer for using the library from other programming languages.
This is the canonical reference for the C API.

## Requirements

- Go 1.23+
- GCC (for CGo)

## Usage Examples

See [../../../examples/ffi/](../../../examples/ffi/) for complete examples in
Java, C#, PHP, Python, Swift and Dart.

## Installation

### Download Pre-built Libraries

Download platform-specific shared libraries from
[GitHub Releases](https://github.com/xseman/bysquare/releases). Each library
ships with a matching C header (`libbysquare-<os>-<arch>.h`).

> [!NOTE]
> Go and TypeScript are released independently from this repository, so
> `releases/latest` may point at a TypeScript release with no Go assets.
> Use the tagged URL below and bump `BASE` to the Go release you want.

```bash
BASE=https://github.com/xseman/bysquare/releases/download/go/v0.4.0

# Linux (AMD64)
curl -LO ${BASE}/libbysquare-linux-amd64.so
curl -LO ${BASE}/libbysquare-linux-amd64.h
mv libbysquare-linux-amd64.so libbysquare.so  # optional, for easier usage

# macOS (ARM64)
curl -LO ${BASE}/libbysquare-darwin-arm64.dylib
curl -LO ${BASE}/libbysquare-darwin-arm64.h

# macOS (AMD64)
curl -LO ${BASE}/libbysquare-darwin-amd64.dylib
curl -LO ${BASE}/libbysquare-darwin-amd64.h
```

```powershell
# Windows (AMD64)
$base = "https://github.com/xseman/bysquare/releases/download/go/v0.4.0"
Invoke-WebRequest -Uri "$base/libbysquare-windows-amd64.dll" -OutFile "libbysquare.dll"
```

### Build from Source

```bash
cd go
make build-ffi
```

Outputs `bin/libbysquare.so` on Linux, `bin/libbysquare.dylib` on macOS and
`bin/libbysquare.dll` on Windows, alongside the generated C header.

## API Reference

```c
// PAY by square: Encode JSON payment data to QR string
// jsonData: JSON string containing payment information
// config: 32-bit integer configuration (-1 for defaults)
//   - Bits 0-23: Feature flags (deburr=0x01, validate=0x02)
//   - Bits 24-31: Version field (0=v1.0.0, 1=v1.1.0, 2=v1.2.0)
//   - Special: -1 for auto-defaults (v1.2.0 + deburr + validate)
// Returns: QR string on success, "ERROR:<message>" on failure
char* bysquare_pay_encode(char* jsonData, int config);

// PAY by square: Decode QR string to JSON payment data
// qrString: PAY by square QR code string
// Returns: JSON string on success, "ERROR:<message>" on failure
char* bysquare_pay_decode(char* qrString);

// Invoice by square: Encode JSON invoice data to QR string
// jsonData: JSON string containing invoice information
// config: 32-bit integer configuration (-1 for defaults)
//   - Config layout same as bysquare_pay_encode
//   - Invoice defaults: v1.0.0 + validate (no deburr)
// Returns: QR string on success, "ERROR:<message>" on failure
char* bysquare_invoice_encode(char* jsonData, int config);

// Invoice by square: Decode QR string to JSON invoice data
// qrString: Invoice by square QR code string
// Returns: JSON string on success, "ERROR:<message>" on failure
char* bysquare_invoice_decode(char* qrString);

// Auto-detect BySquare type from QR header
// qrString: Any BySquare QR code string
// Returns: 0=pay, 1=invoice, -1=error
int bysquare_detect_type(char* qrString);

// Free memory allocated by the library
// ptr: String returned by encode, decode, or version
void bysquare_free(char* ptr);

// Get library version
// Returns: Version string of the release the library was built from,
//          or "dev" for a local build without -ldflags - caller must free
char* bysquare_version();
```

## Configuration

Pass an integer config value to `bysquare_pay_encode()` and
`bysquare_invoice_encode()`:

- `config = -1` → automatic defaults
- `config = 0` → v1.0.0 with no flags
- `config = <bitflags>` → custom configuration

```c
// Feature flags (bits 0-23)
#define BYSQUARE_DEBURR   0x00000001  // Bit 0: Remove diacritics (ľščťž -> lstz)
#define BYSQUARE_VALIDATE 0x00000002  // Bit 1: Validate input before encoding

// Version values (bits 24-31)
#define BYSQUARE_VERSION_100 (0 << 24)  // v1.0.0 (released 2013-02-22)
#define BYSQUARE_VERSION_110 (1 << 24)  // v1.1.0 (released 2015-06-24)
#define BYSQUARE_VERSION_120 (2 << 24)  // v1.2.0 (released 2025-04-01)

// Usage examples:
char* qr1 = bysquare_pay_encode(json, -1);  // Auto-defaults
char* qr2 = bysquare_pay_encode(json, 0);   // v1.0.0, no flags
char* qr3 = bysquare_pay_encode(json, BYSQUARE_DEBURR | BYSQUARE_VERSION_110);
```

**Defaults when `config = -1`:**

| Function                  | deburr | validate | version        |
| ------------------------- | ------ | -------- | -------------- |
| `bysquare_pay_encode`     | true   | true     | 2 (PAY v1.2.0) |
| `bysquare_invoice_encode` | false  | true     | 0 (v1.0.0)     |

## Error Handling

Errors are returned as strings with an `ERROR:` prefix:

```c
char* result = bysquare_pay_encode(json, -1);
if (strncmp(result, "ERROR:", 6) == 0) {
    // Error occurred - message starts at result[6]
    fprintf(stderr, "Encoding failed: %s\n", result + 6);
    bysquare_free(result);  // Must still free the error string
    return 1;
}

// Success - use the QR string
printf("QR: %s\n", result);
bysquare_free(result);
```

**Example error messages:**

- `ERROR:invalid IBAN (ISO 13616): SK123`
- `ERROR:amount must be positive`
- `ERROR:invalid JSON: unexpected end of input`
- `ERROR:panic: runtime error: index out of range` (internal panic recovery)

## Memory Management

Always call `bysquare_free()` on strings returned by the encode, decode and
version functions, including error strings.

## Thread Safety

All functions are fully thread-safe and can be called concurrently from
multiple threads.

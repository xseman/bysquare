# Foreign Function Interface (FFI)

C-compatible FFI layer for using library from other programming languages.

## Requirements

- Go 1.23+
- GCC (for CGo)

## Usage Examples

See [../../examples/ffi/](../../examples/ffi/) for complete examples in Java,
C#, PHP, Python, and Swift.

**Configuration Options:**

Pass an integer config value to `bysquare_encode()`:

- `config = 0` → Use automatic defaults (deburr + validate + v1.2.0)
- `config = <bitflags>` → Custom configuration using bitflags

**Bitflag Configuration:**

```c
// Feature flags (bits 0-23)
#define BYSQUARE_DEBURR   0x00000001  // Bit 0: Remove diacritics
#define BYSQUARE_VALIDATE 0x00000002  // Bit 1: Validate input data

// Version values (bits 24-31)
#define BYSQUARE_VERSION_100 (0 << 24)  // v1.0.0
#define BYSQUARE_VERSION_110 (1 << 24)  // v1.1.0
#define BYSQUARE_VERSION_120 (2 << 24)  // v1.2.0

// Usage examples:
char* qr1 = bysquare_encode(json, 0);  // Auto-defaults
char* qr2 = bysquare_encode(json, BYSQUARE_DEBURR | BYSQUARE_VERSION_110);
```

## Installation

### Download Pre-built Libraries

Download platform-specific shared libraries from [GitHub Releases](https://github.com/xseman/bysquare/releases):

**Linux (AMD64):**

```bash
curl -LO https://github.com/xseman/bysquare/releases/latest/download/libbysquare-linux-amd64.so
# Rename for easier usage (optional)
mv libbysquare-linux-amd64.so libbysquare.so
```

**macOS (ARM64):**

```bash
curl -LO https://github.com/xseman/bysquare/releases/latest/download/libbysquare-darwin-arm64.dylib
# Rename for easier usage (optional)
mv libbysquare-darwin-arm64.dylib libbysquare.dylib
```

**macOS (AMD64):**

```bash
curl -LO https://github.com/xseman/bysquare/releases/latest/download/libbysquare-darwin-amd64.dylib
# Rename for easier usage (optional)
mv libbysquare-darwin-amd64.dylib libbysquare.dylib
```

**Windows (AMD64):**

```powershell
$url = "https://github.com/xseman/bysquare/releases/" +
  "latest/download/libbysquare-windows-amd64.dll"
Invoke-WebRequest -Uri $url -OutFile "libbysquare.dll"
```

### Build from Source

```bash
cd go
make build-ffi
# Output: bin/libbysquare.so (current platform)
```

The build script generates platform-specific filenames. You may want to create
a symlink or rename the file for easier usage:

```bash
# Linux example
ln -s libbysquare-linux-amd64.so bin/libbysquare.so
```

## API Reference

The library provides a simple, bitflag-based configuration API:

```c
// Encode JSON payment data to QR string
// jsonData: JSON string containing payment information
// config: 32-bit integer configuration (0 for defaults)
//   - Bits 0-23: Feature flags (deburr=0x01, validate=0x02)
//   - Bits 24-31: Version field (0=v1.0.0, 1=v1.1.0, 2=v1.2.0)
// Returns: QR string on success, "ERROR:<message>" on failure
char* bysquare_encode(char* jsonData, int config);

// Decode QR string to JSON payment data
// qrString: PAY by square QR code string
// Returns: JSON string on success, "ERROR:<message>" on failure
char* bysquare_decode(char* qrString);

// Free memory allocated by the library
// ptr: String returned by encode, decode, or version
void bysquare_free(char* ptr);

// Get library version
// Returns: Version string (e.g., "0.1.0") - caller must free
char* bysquare_version();
```

**Configuration Bitflags:**

```c
// Feature flags (bits 0-1)
BYSQUARE_DEBURR   = 0x00000001  // Remove diacritics (ľščťž → lstz)
BYSQUARE_VALIDATE = 0x00000002  // Validate input before encoding

// Version values (bits 24-31)
BYSQUARE_VERSION_100 = (0 << 24)  // 0x00000000 - v1.0.0 (2013-02-22)
BYSQUARE_VERSION_110 = (1 << 24)  // 0x01000000 - v1.1.0 (2015-06-24)
BYSQUARE_VERSION_120 = (2 << 24)  // 0x02000000 - v1.2.0 (2025-04-01)
```

### Version Constants

| Value | Version | Release Date |
| ----- | ------- | ------------ |
| 0     | 1.0.0   | 2013-02-22   |
| 1     | 1.1.0   | 2015-06-24   |
| 2     | 1.2.0   | 2025-04-01   |

### Error Handling

Errors are returned as strings with "ERROR:" prefix:

```c
char* result = bysquare_encode(json, 0);
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

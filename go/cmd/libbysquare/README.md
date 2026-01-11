# Foreign Function Interface (FFI)

C-compatible FFI layer for using library from other programming languages.

## Requirements

- Go 1.23+
- GCC (for CGo)

## Tested Languages

- Python (via ctypes)
- PHP (via FFI extension)
- Java (via JNA)

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
./scripts/build-ffi.sh
# Output: bin/libbysquare-{platform}-{arch}.{so,dylib,dll}
# e.g., bin/libbysquare-linux-amd64.so
```

The build script generates platform-specific filenames. You may want to create
a symlink or rename the file for easier usage:

```bash
# Linux example
ln -s libbysquare-linux-amd64.so bin/libbysquare.so
```

## API Reference

### Function Signatures

```c
// Encode payment data (JSON string) to BySquare QR string
char* bysquare_encode(char* jsonData);

// Decode BySquare QR string to payment data (JSON string)
char* bysquare_decode(char* qrString);

// Free memory allocated by the library
void bysquare_free(char* ptr);

// Get library version
char* bysquare_version();
```

### Error Handling

Errors are returned as JSON with `error` field:

```json
{
	"error": "Encoding error: invalid IBAN (ISO 13616)"
}
```

## Thread Safety

The library is **thread-safe** for concurrent encoding/decoding operations. Each
function call is independent.

## Library Naming

The build script generates platform-specific filenames (e.g.,
`libbysquare-linux-amd64.so`). For convenience, examples assume the library is
renamed or symlinked to:

- `libbysquare.so` (Linux)
- `libbysquare.dylib` (macOS)
- `libbysquare.dll` (Windows)

JNA (Java) automatically handles the "lib" prefix and extension, so use
`Native.load("bysquare", ...)` which will search for `libbysquare.{so,dylib,dll}`.

## Building FFI Library

### Build Commands

```bash
# Linux
./scripts/build-ffi.sh linux

# macOS
./scripts/build-ffi.sh darwin

# Windows (cross-compile)
./scripts/build-ffi.sh windows

# All platforms
./scripts/build-ffi.sh all
```

### Cross-Compilation

```bash
# Example: Build Windows DLL from Linux
GOOS=windows GOARCH=amd64 CGO_ENABLED=1 CC=x86_64-w64-mingw32-gcc \
  go build -buildmode=c-shared -o libbysquare-windows-amd64.dll ./cmd/libbysquare
```

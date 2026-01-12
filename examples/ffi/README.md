# FFI Examples

This directory contains Foreign Function Interface (FFI) examples demonstrating
how to use the bysquare library from various programming languages via the C
FFI.

## Overview

The Go implementation provides a C-compatible shared library that can be used
from any language supporting C FFI. These examples show practical
implementations across popular languages.

## Available Examples

| Language          | Implementation           | Key Features                                |
| ----------------- | ------------------------ | ------------------------------------------- |
| [Java](java/)     | JNA (Java Native Access) | Auto-downloads dependencies, cross-platform |
| [PHP](php/)       | Built-in FFI extension   | Requires PHP 7.4+ with FFI enabled          |
| [Python](python/) | ctypes module            | Standard library, no extra dependencies     |
| [Swift](swift/)   | C interoperability       | Native Swift types, memory-safe             |

## Prerequisites

### 1. Build the FFI Library

Build the shared library from this directory:

```bash
./build.sh
```

This creates the platform-specific library in `../../go/bin/`:

- Linux: `libbysquare.so`
- macOS: `libbysquare.dylib`
- Windows: `libbysquare.dll`

### 2. Language-Specific Requirements

Each example has its own requirements. See individual directories for details.

## C API Reference

The library exposes four C functions:

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

### Memory Management

**Critical:** Always call `bysquare_free()` on returned strings to prevent
memory leaks.

```python
# Example in Python
result = lib.bysquare_encode(json_data)
try:
    data = json.loads(result.decode('utf-8'))
finally:
    lib.bysquare_free(result)  # Always free!
```

## Usage Pattern

All examples follow this pattern:

1. Load the shared library
2. Define C function signatures
3. Prepare JSON data
4. Call `bysquare_encode()` or `bysquare_decode()`
5. Process the result
6. **Free allocated memory** with `bysquare_free()`

## Running Examples

Each language directory includes a `run.sh` script:

```bash
# Java
cd java && ./run.sh

# PHP
cd php && ./run.sh

# Python
cd python && ./run.sh

# Swift
cd swift && ./run.sh
```

## Troubleshooting

### Library Not Found

Ensure the FFI library exists in `../../go/bin/`:

```bash
ls -la ../../go/bin/libbysquare.*
```

If missing, run `./build.sh` from the `examples/ffi` directory.

### Platform-Specific Issues

**Linux:** Set `LD_LIBRARY_PATH`:

```bash
export LD_LIBRARY_PATH=../../go/bin:$LD_LIBRARY_PATH
```

**macOS:** Set `DYLD_LIBRARY_PATH`:

```bash
export DYLD_LIBRARY_PATH=../../go/bin:$DYLD_LIBRARY_PATH
```

**Windows:** Ensure the DLL is in the same directory as your executable or in `PATH`.

## JSON Data Format

All examples use the same JSON structure:

```json
{
	"invoiceId": "12345",
	"payments": [
		{
			"type": 1,
			"amount": 123.45,
			"currencyCode": "EUR",
			"bankAccounts": [
				{ "iban": "SK9611000000002918599669" }
			],
			"variableSymbol": "987654",
			"paymentNote": "Payment note"
		}
	]
}
```

See the [Go package documentation](../../go/) for complete type definitions.

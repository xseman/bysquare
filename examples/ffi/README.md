# FFI Examples

Minimal examples demonstrating how to use the bysquare C library from various
languages.

## Overview

The Go implementation provides a C-compatible shared library that can be used
from any language supporting C FFI.

## Available Examples

| Language          | Implementation            | Requirements      |
| ----------------- | ------------------------- | ----------------- |
| [Java](java/)     | Foreign Function & Memory | JDK 19+ (JEP 454) |
| [C#](csharp/)     | P/Invoke                  | .NET SDK 8.0+     |
| [PHP](php/)       | Built-in FFI              | PHP 7.4+ with FFI |
| [Python](python/) | ctypes                    | Python 3.6+       |
| [Swift](swift/)   | C interoperability        | Swift 5+          |

## Architecture

```mermaid
---
config:
  theme: neutral
  themeVariables:
    fontFamily: monospace
    fontSize: "10px"
---

flowchart TB
    subgraph Bindings["Language Bindings"]
        ANY["Any Language"]
    end

    subgraph FFI["C FFI Layer"]
        CFG["1. create_config()"]
        SET["2. config_set_*()"]
        ENC["3. encode()"]
        DEC["3. decode()"]
        FREE["4. free()"]
    end

    subgraph Core["Go Core"]
        LIB["libbysquare.so/dll"]
    end

    ANY --> CFG
    CFG --> SET
    SET --> ENC & DEC
    ENC & DEC --> LIB
    LIB --> FREE

    style CFG fill:#E1BEE7,stroke:#7B1FA2,stroke-width:1.5px
    style SET fill:#E1BEE7,stroke:#7B1FA2,stroke-width:1.5px
    style ENC fill:#E1BEE7,stroke:#7B1FA2,stroke-width:1.5px
    style DEC fill:#E1BEE7,stroke:#7B1FA2,stroke-width:1.5px
    style FREE fill:#E1BEE7,stroke:#7B1FA2,stroke-width:1.5px
    style LIB fill:#A5EAFF,stroke:#00838F,stroke-width:1.5px
```

**Configuration Pattern:**

1. Create config handle with defaults
2. Set options (deburr, validate, version)
3. Encode or decode payment data
4. Free allocated memory

## Prerequisites

**Note:** These examples are designed for Linux. For macOS/Windows support, you'll
need to adapt the build and run scripts for platform-specific library extensions.

Build the shared library:

```bash
./build.sh
```

This creates `libbysquare.so` in `../../go/bin/`.

## C API

```c
// Create configuration handle with defaults
// (deburr=1, validate=1, version=2)
uintptr_t bysquare_create_config();

// Configure options using setters (all optional)
void bysquare_config_set_deburr(uintptr_t handle, int enabled);
void bysquare_config_set_validate(uintptr_t handle, int enabled);
void bysquare_config_set_version(uintptr_t handle, int version);

// Encode with configuration
char* bysquare_encode(char* jsonData, uintptr_t configHandle);

// Decode QR string to JSON
char* bysquare_decode(char* qrString);

// Free configuration handle
void bysquare_free_config(uintptr_t configHandle);

// Free memory allocated by the library
void bysquare_free(char* ptr);

// Get library version
char* bysquare_version(void);
```

**Important:** Always call `bysquare_free()` on returned strings and
`bysquare_free_config()` on config handles.

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

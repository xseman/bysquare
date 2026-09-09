# CLI Examples

Command-line usage examples for the bysquare library.

## Example Files

- [example.json](example.json) - Single payment example
- [example.jsonl](example.jsonl) - Multiple payments (JSON Lines format)
- [invoice.json](invoice.json) - Single invoice example

## Scripts

- [nodejs.sh](nodejs.sh) - Encode and display QR using Node.js CLI
- [go.sh](go.sh) - Encode and display QR using Go CLI

## Usage

The Node.js and Go CLIs expose the same commands and flags - only the
executable differs:

- **Node.js:** `npx bysquare ...`
- **Go:** `../../go/bin/bysquare ...` (build it first with `cd ../../go && make build`)

The examples below use `bysquare` as a stand-in for either one.

```bash
# PAY: Encode with defaults (deburr=true, validate=true, version=1.2.0)
bysquare pay encode example.json

# PAY: Encode with specific version
bysquare pay encode --spec-version 1.1.0 example.json

# PAY: Encode without validation
bysquare pay encode --no-validate example.json

# PAY: Encode from stdin
cat example.json | bysquare pay encode -

# PAY: Encode JSONL (multiple payments)
bysquare pay encode example.jsonl

# PAY: Decode QR string
bysquare pay decode "0804Q000AEM958..."

# Invoice: Encode
bysquare invoice encode invoice.json

# Invoice: Decode QR string
bysquare invoice decode "2008400092SP3AEI..."

# Auto-detect and decode any BySquare QR string
bysquare decode "0804Q000AEM958..."

# Show version
bysquare version
```

## Options

**PAY encode:**

- `-D, --no-deburr` - Keep diacritics (deburr enabled by default)
- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0, 1.1.0, 1.2.0
  (default: 1.2.0)

**Invoice encode:**

- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0 (default: 1.0.0)

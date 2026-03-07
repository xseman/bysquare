# CLI Examples

Command-line usage examples for the bysquare library.

## Example Files

- [example.json](example.json) - Single payment example
- [example.jsonl](example.jsonl) - Multiple payments (JSON Lines format)

## Scripts

- [nodejs.sh](nodejs.sh) - Encode and display QR using Node.js CLI
- [go.sh](go.sh) - Encode and display QR using Go CLI

## Usage

**Node.js:**

```bash
# PAY: Encode with defaults (deburr=true, validate=true, version=1.2.0)
npx bysquare pay encode example.json

# PAY: Encode with specific version
npx bysquare pay encode --spec-version 1.1.0 example.json

# PAY: Encode without validation
npx bysquare pay encode --no-validate example.json

# PAY: Encode from stdin
cat example.json | npx bysquare pay encode -

# PAY: Encode JSONL (multiple payments)
npx bysquare pay encode example.jsonl

# PAY: Decode QR string
npx bysquare pay decode "0804Q000AEM958..."

# Invoice: Encode
npx bysquare invoice encode invoice.json

# Invoice: Decode QR string
npx bysquare invoice decode "..."

# Auto-detect and decode any BySquare QR string
npx bysquare decode "0804Q000AEM958..."

# Show version
npx bysquare version
```

**Go:**

First build the binary:

```bash
cd ../../go && make build
```

```bash
# PAY: Encode with defaults (deburr=true, validate=true, version=1.2.0)
../../go/bin/bysquare pay encode example.json

# PAY: Encode with specific version
../../go/bin/bysquare pay encode --spec-version 1.1.0 example.json

# PAY: Encode without validation
../../go/bin/bysquare pay encode --no-validate example.json

# PAY: Encode from stdin
cat example.json | ../../go/bin/bysquare pay encode -

# PAY: Encode JSONL (multiple payments)
../../go/bin/bysquare pay encode example.jsonl

# PAY: Decode QR string
../../go/bin/bysquare pay decode "0804Q000AEM958..."

# Invoice: Encode
../../go/bin/bysquare invoice encode invoice.json

# Invoice: Decode QR string
../../go/bin/bysquare invoice decode "..."

# Auto-detect and decode any BySquare QR string
../../go/bin/bysquare decode "0804Q000AEM958..."

# Show version
../../go/bin/bysquare version
```

## Node.js Options

**PAY encode:**

- `-D, --no-deburr` - Keep diacritics (deburr enabled by default)
- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0, 1.1.0, 1.2.0
  (default: 1.2.0)

**Invoice encode:**

- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0 (default: 1.0.0)

## Go Options

**PAY encode:**

- `-D, --no-deburr` - Keep diacritics (deburr enabled by default)
- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0, 1.1.0, 1.2.0
  (default: 1.2.0)

**Invoice encode:**

- `-V, --no-validate` - Skip validation (validation enabled by default)
- `-s, --spec-version VER` - Specification version: 1.0.0 (default: 1.0.0)

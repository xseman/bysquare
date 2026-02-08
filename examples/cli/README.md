# CLI Examples

Command-line usage examples for the bysquare library.

## Example Files

- [example.json](example.json) - Single payment example
- [example.jsonl](example.jsonl) - Multiple payments (JSON Lines format)

## Scripts

- [nodejs.sh](nodejs.sh) - Encode and display QR using Node.js CLI
- [go.sh](go.sh) - Encode and display QR using Go CLI

## Usage

Both CLIs share the same API:

**Node.js:**

```bash
# Encode with defaults (deburr=true, validate=true, version=1.2.0)
npx bysquare encode example.json

# Encode with specific version
npx bysquare encode --spec-version 1.1.0 example.json

# Encode without validation
npx bysquare encode --no-validate example.json

# Encode from stdin
cat example.json | npx bysquare encode -

# Encode JSONL (multiple payments)
npx bysquare encode example.jsonl

# Decode QR string
npx bysquare decode "0804Q000AEM958..."

# Show version
npx bysquare version
```

**Go:**

First build the binary:

```bash
cd ../../go && make build
```

Then use the same commands:

```bash
# Encode with defaults
../../go/bin/bysquare encode example.json

# Encode with specific version
../../go/bin/bysquare encode --spec-version 1.1.0 example.json

# Encode without validation
../../go/bin/bysquare encode --no-validate example.json

# Encode from stdin
cat example.json | ../../go/bin/bysquare encode -

# Encode JSONL (multiple payments)
../../go/bin/bysquare encode example.jsonl

# Decode QR string
../../go/bin/bysquare decode "0804Q000AEM958..."

# Show version
../../go/bin/bysquare version
```

## Common Options

Both CLIs support:

- `-d, --deburr` - Remove diacritics (default: true)
- `-D, --no-deburr` - Keep diacritics
- `-v, --validate` - Validate before encoding (default: true)
- `-V, --no-validate` - Skip validation
- `-s, --spec-version VER` - Specification version: 1.0.0, 1.1.0, 1.2.0
  (default: 1.2.0)

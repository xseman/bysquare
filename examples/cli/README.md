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
./nodejs.sh
```

Or directly:

```bash
npx bysquare encode example.json
```

**Go:**

First build the binary:

```bash
cd ../../go && make build
```

Then run:

```bash
./go.sh
```

Or directly:

```bash
../../go/bin/bysquare encode example.json
```

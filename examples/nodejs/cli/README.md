# CLI Example

Command-line usage of the bysquare library.

## Encoding

Encode payment data from a JSON file:

```bash
npx bysquare --encode example.json
```

Display as a QR code in the terminal:

```bash
npx bysquare --encode example.json | npx qrcode-terminal
```

## Example Files

- [example.json](example.json) - Single payment example
- [example.jsonl](example.jsonl) - Multiple payments (JSON Lines format)

## Related Documentation

- [TypeScript Library](../../../typescript/README.md) - Full API documentation

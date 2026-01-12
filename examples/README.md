# Examples

Usage examples for the bysquare library across different platforms and languages.

## Browser

Web-based examples using HTML and JavaScript:

- [Browser Examples](browser/) - Vanilla JS, Lit, Preact, and PDF extraction

## Node.js

Server-side and CLI examples:

- [CLI](nodejs/cli/) - Command-line usage
- [Server](nodejs/server/) - Node.js/Bun/Deno integration

## FFI (Foreign Function Interface)

Use bysquare from other programming languages via C FFI:

- [Java](ffi/java/) - Using JNA
- [PHP](ffi/php/) - Using FFI extension
- [Python](ffi/python/) - Using ctypes
- [Swift](ffi/swift/) - Using C interoperability

See [FFI README](ffi/README.md) for setup instructions.

## Quick Start

**Browser:** Open any HTML file directly in a browser

**Node.js:**

```bash
cd nodejs/server && npm install && npm start
```

**CLI:**

```bash
npx bysquare --encode nodejs/cli/example.json
```

**FFI:** Build the library first:

```bash
cd ffi && ./build.sh
```

Then run language-specific examples (see individual directories).

## Related Documentation

- [TypeScript Library](../typescript/README.md)
- [Go Library](../go/README.md)

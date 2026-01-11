<h1 align="center">bysquare</h1>

<p align="center">
"PAY by square" is a national standard for QR code payments that was adopted
by the Slovak Banking Association in 2013. It is incorporated into a variety
of invoices, reminders and other payment regulations.
</p>

## Why

It's simple, I couldn't find any free implementation of "PAY by square"
standard, so I decided to create one and share it with the community to help
individuals and businesses to create QR codes for their invoices.

## Features

- Compatible with Slovak banking apps
- Isomorphic Browser & Runtime-independent (Browser, Node.js, Bun, Deno)
- Compatible with any system language using C Foreign Function Interface (CFFI)

## Implementations

This repository provides multiple language implementations of the PAY by square
standard:

- **[TypeScript](typescript/)** - Supports Browsers and any runtime Node.js, Bun, Deno
- **[Go](go/)** - Native Go implementation with CLI tool and C-compatible FFI

Both implementations are fully compatible with each other and follow the same specification.

```mermaid
%%{init: {'theme': 'neutral', 'flowchart': {'nodeSpacing': 30, 'rankSpacing': 50}} }%%
graph TD
    A[Specification] --> B[TypeScript]
    A --> C[Go]

    B --> D[Library]
    B --> E[CLI Tool]
    B --> F[Browsers]
    B --> G[Node.js / Bun / Deno]

    C --> H[Library]
    C --> I[CLI Tool]
    C --> J[C FFI]

    J --> K[Python / PHP / Java<br/>Swift / etc.]
```

## Using C FFI

The Go implementation provides a C-compatible Foreign Function Interface (FFI), allowing you to use the library from any language that supports C bindings.

**Available examples:**

- **[Java](examples/java/)** - Using JNA (Java Native Access)
- **[PHP](examples/php/)** - Using FFI extension
- **[Python](examples/python/)** - Using `ctypes`
- **[Swift](examples/swift/)** - Using Swift's C interoperability

See [FFI examples](examples/) for setup and usage instructions.

## Related

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

# Browser Examples

Client-side examples demonstrating the bysquare library in web browsers.

## Examples

| Example                                    | Description                       |
| ------------------------------------------ | --------------------------------- |
| [native-example.html](native-example.html) | Vanilla JavaScript implementation |
| [lit-example.html](lit-example.html)       | Lit web components                |
| [preact-example.html](preact-example.html) | Preact framework                  |
| [multi-example.html](multi-example.html)   | Multiple payment handling         |
| [pdf-extraction.html](pdf-extraction.html) | Extract QR codes from PDF files   |

## Quick Start

The examples import ES modules from a CDN, so they need to be served over
HTTP - opening the files via `file://` will not work.

```bash
python3 -m http.server 8000
# or
npx serve
```

Then open the example you want, e.g. `http://localhost:8000/native-example.html`
(adjust the port if your server picks a different one).

## Features

All examples demonstrate:

- Encoding payment data to QR codes
- Real-time QR code generation
- Interactive forms
- No build step required (uses ESM CDN)

## Library Import

All examples use the bysquare library via CDN:

```javascript
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@4/pay";
```

## Related Documentation

- [TypeScript Library](../../typescript/README.md) - Full API documentation
- [Node.js Examples](../nodejs/) - Server-side usage

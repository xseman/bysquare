# bysquare

Simple JavaScript library to encode and decode "PAY by square" string.

**What is `PAY by square`?**

It's a national standard for QR code payments that was adopted by the Slovak
Banking Association in 2013. It is incorporated into a variety of invoices,
reminders and other payment regulations.

**Can I generate an image?**

This library doesn't have a specific opinion and how the QR code string is
transformed into images depends on how you implement it. See
[examples](./docs/examples/).

## Features

- Encode data to qr string
- Decode data to json
- Detect bysquare from qr string

## Installation

**NOTE**: This package is native [ESM][mozzila-esm] and no longer provides a
CommonJS export. If your project uses CommonJS, you will have to convert to ESM
or use the dynamic [`import()`][mozzila-import] function.

[mozzila-esm]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[mozzila-import]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import

### npm registry

```sh
npm install bysquare
```

### CLI Node `v18+`

```sh
npm install --global bysquare
```

### deno

Since `v1.28+` import from npm registry using `npm:` prefix.

```ts
import {
	decode,
	encode,
} from "npm:bysquare@2.8.0";
```

### Browser

```html
<script type="module">
	import { encode, decode } from "https://esm.sh/bysquare@2.8.0/";
</script>
```

## How it works

### Encoding sequence

![logic](./docs/uml/logic.svg)

## Usage

### Encode

```ts
import {
	CurrencyCode,
	DataModel,
	encode,
	PaymentOptions,
} from "bysquare";

// string ready to be encoded to QR
const qrString = encode({
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{
					iban: "SK9611000000002918599669",
				},
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
});
```

### Decode

```ts
import { decode } from "bysquare";

const model = decode(
	"0405QH8090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000",
);

// {
// 	invoiceId: "random-id",
// 	payments: [
// 		{
// 			type: 1,
// 			amount: 100.0,
// 			bankAccounts: [
// 				{ iban: "SK9611000000002918599669" },
// 			],
// 			currencyCode: "EUR",
// 			variableSymbol: "123",
// 		}
// 	]
// }
//
```

## CLI

### Encode

Encode JSON or JSONL data from files and print the corresponding QR code.

```sh
npx bysquare --encode file1.json file2.json...
npx bysquare --encode file.jsonl
```

### Decode

Decode the specified QR code string and print the corresponding JSON data. The
qrstring argument should be a valid QR code string.

```sh
npx bysquare --decode <qrstring>
```

## Platform support

I mainly focus on LTS versions of Node.js and try to use the most idiomatic
ECMAScript possible to avoid specific runtime coupling.

This doesn't mean that the library won't work on older versions, but it might
not be as reliable.

As of `v1.28`, Deno now includes built-in support for npm modules and is ready
to use without additional setup, showing its improved maturity.

### Node.js & Deno

- Node.js `v18` and later.
- Deno `v1.28` and later.

### Browser

The latest version of Chrome, Firefox, and Safari.

## Related

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.bsqr.co/schema/>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

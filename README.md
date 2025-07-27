# bysquare

"PAY by square" is a national standard for QR code payments that was adopted by
the Slovak Banking Association in 2013. It is incorporated into a variety of
invoices, reminders and other payment regulations.

## Why

It's simple, I couldn't find any implementation of "PAY by square" standard for
JavaScript, so I decided to create one and share it with the community to help
individuals and businesses to create QR codes for their invoices.

## Features

- TypeScript support
- Compatible with Slovak banking apps
- Runtime-independent JavaScript implementation

## Installation

> [!NOTE]
> This package is native [ESM][mozzila-esm] and no longer provides a
> CommonJS export. If your project uses CommonJS, you will have to convert to ESM
> or use the dynamic [`import()`][mozzila-import] function.

[mozzila-esm]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[mozzila-import]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import

### [npm](https://npmjs.com/bysquare)

```sh
$ npm install bysquare
```

### browser

```html
<script type="module">
	import { encode, decode } from "https://esm.sh/bysquare@latest";
</script>
```

## Quick start

This library provides `encode` and `decode` functions to work with the data
model directly, allowing you to create customized payment solutions.

### Creating Payment QR Codes

To generate QR codes for different payment types, use the `encode` function with
the appropriate payment configuration:

#### Simple Payment (Payment Order)

```js
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "bysquare";

const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.PaymentOrder, // 1
			amount: 50.75,
			variableSymbol: "123456",
			currencyCode: CurrencyCode.EUR, // "EUR"
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
});
```

#### Direct Debit

```js
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "bysquare";

const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.DirectDebit, // 2
			amount: 25.0,
			variableSymbol: "789012",
			currencyCode: CurrencyCode.EUR, // "EUR"
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
});
```

#### Standing Order

```js
import {
	CurrencyCode,
	encode,
	Month,
	PaymentOptions,
	Periodicity,
} from "bysquare";

const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.StandingOrder, // 3
			amount: 100.0,
			variableSymbol: "654321",
			currencyCode: CurrencyCode.EUR, // "EUR"
			day: 15,
			month: Month.January, // Single month
			periodicity: Periodicity.Monthly, // "m"
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
});
```

#### Standing Order with Multiple Months

For standing orders that should execute in specific months, you can combine
multiple months using bitwise OR operators:

```js
import {
	CurrencyCode,
	encode,
	encodeOptions,
	Month,
	PaymentOptions,
	Periodicity,
} from "bysquare";

const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 100.0,
			variableSymbol: "654321",
			currencyCode: CurrencyCode.EUR,
			day: 15,
			// Execute in January, July, and October only
			month: Month.January | Month.July | Month.October, // Results in 577
			periodicity: Periodicity.Monthly,
			lastDate: "20251231",
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
});

// Alternative: Use the utility function to encode multiple months
const monthsToEncode = [Month.January, Month.July, Month.October];
const encodedMonths = encodeOptions(monthsToEncode);

const qrstring2 = encode({
	payments: [
		{
			type: PaymentOptions.StandingOrder,
			amount: 100.0,
			variableSymbol: "654321",
			currencyCode: CurrencyCode.EUR,
			day: 15,
			month: encodedMonths, // Same result: 577
			periodicity: Periodicity.Monthly,
			lastDate: "20251231",
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
		},
	],
});
```

### HTML example

This example shows how to generate a payment QR code and display it in a web
page:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>Payment QR Code</title>
	</head>
	<body>
		<div id="qrcode" style="width: 200px"></div>

		<script type="module">
			import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
			import { encode, PaymentOptions, CurrencyCode } from "https://esm.sh/bysquare@latest";

			const qrstring = encode({
				payments: [
					{
						type: PaymentOptions.PaymentOrder,
						amount: 123.45,
						variableSymbol: "987654",
						currencyCode: CurrencyCode.EUR,
						bankAccounts: [
							{ iban: "SK9611000000002918599669" }
						],
					},
				],
			});

			const qrElement = document.getElementById("qrcode");
			qrElement.appendChild(QRCode.generateSVG(qrstring));
		</script>
	</body>
</html>
```

### Advanced usage

For more complex data with multiple payments and additional fields:

> [!NOTE]
> Encoded data are without diacritics
>
> The library removes all diacritics from the input data to ensure maximum
> compatibility, as not all banks support diacritics, which may lead to errors.
> If you need to retain diacritics, disable deburr option when encoding data -
> `encode(model, { deburr: false })`.

```ts
import {
	CurrencyCode,
	DataModel,
	decode,
	encode,
	PaymentOptions,
} from "bysquare";

const data = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 100.0,
			variableSymbol: "123",
			paymentNote: "hello world",
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
				// ...more bank accounts
			],
			// ...more fields
		},
		// ...more payments
	],
} satisfies DataModel;

// Encode data to a QR string
const qrstring = encode(data);

// Decode QR string back to the original data model
const model = decode(qrstring);
```

## Classifier Utilities

The library provides utility functions for working with multiple classifier
options as specified in the PAY by Square standard. These functions are
particularly useful for handling multiple month selections in standing orders.

### Encoding Multiple Options

```ts
import {
	encodeOptions,
	Month,
} from "bysquare";

// Encode multiple months into a single value
const monthsArray = [Month.January, Month.July, Month.October];
const encoded = encodeOptions(monthsArray);
console.log(encoded); // 577 (1 + 64 + 512)

// This matches the specification example:
// January=1, July=64, October=512, sum=577
```

## CLI

```sh
$ npm install --global bysquare
```

### Encode

Encode JSON or JSONL data from files and print the corresponding QR code.

```sh
$ bysquare --encode file1.json file2.json...
$ bysquare --encode file.jsonl
```

### Decode

Decode the specified QR code string and print the corresponding JSON data. The
qrstring argument should be a valid QR code string.

```sh
$ bysquare --decode <qrstring>
```

## How it works

### Data Flow

### Encoding/Decoding Architecture

<image src="./docs/logic.svg" alt="encode" width="500px">

## Related

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.bsqr.co/schema/>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

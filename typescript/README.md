<h1 align="center">bysquare</h1>

<p align="center">
	"PAY by square" is a national standard for QR code payments that was adopted by
	the Slovak Banking Association in 2013. It is incorporated into a variety of
	invoices, reminders and other payment regulations.
</p>

<p align="center">
	<a href="#features">Features</a> •
	<a href="#installation">Installation</a> •
	<a href="#usage">Usage</a> •
	<a href="#cli">CLI</a> •
	<a href="#validation">Validation</a>
</p>

## Features

- TypeScript support
- CLI tooling
- Compatible with Slovak banking apps
- Isomorphic Browser & Runtime-independent (Browser, Node.js, Bun, Deno)

> [!NOTE]
> Since v3, the implementation is considered stable and specification-complete.\
> No breaking changes are planned. Only minor improvements and bug fixes may be
> introduced.

## Installation

### [npm](https://npmjs.com/bysquare)

```sh
$ npm install bysquare
```

### browser

```html
<script type="module">
	import { encode, decode } from "https://esm.sh/bysquare@latest/pay";
</script>
```

## Usage

This library provides `encode` and `decode` functions to work with the data
model directly, allowing you to create customized payment solutions.

### Pay BySquare

<details>
<summary>HTML example</summary>

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
			import { encode, PaymentOptions, CurrencyCode } from "https://esm.sh/bysquare@latest/pay";

			const qrstring = encode({
				payments: [
					{
						type: PaymentOptions.PaymentOrder,
						amount: 123.45,
						variableSymbol: "987654",
						currencyCode: CurrencyCode.EUR,
						beneficiary: { name: "John Doe" },
						bankAccounts: [{ iban: "SK9611000000002918599669" }],
					},
				],
			});

			const qrElement = document.getElementById("qrcode");
			qrElement.appendChild(QRCode.generateSVG(qrstring));
		</script>
	</body>
</html>
```

</details>

<details>
<summary>Creating Payment QR Codes</summary>

To generate QR codes for different payment types, use the `encode` function with
the appropriate payment configuration:

```js
import {
	CurrencyCode,
	encode,
	Month,
	PaymentOptions,
	Periodicity,
} from "bysquare/pay";

// Simple Payment (Payment Order)
const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.PaymentOrder, // 1
			amount: 50.75,
			variableSymbol: "123456",
			currencyCode: CurrencyCode.EUR, // "EUR"
			beneficiary: { name: "John Doe" },
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
		},
	],
});

// Standing Order
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
			beneficiary: { name: "John Doe" },
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
		},
	],
});

// Direct Debit
const qrstring = encode({
	payments: [
		{
			type: PaymentOptions.DirectDebit, // 2
			amount: 25.0,
			variableSymbol: "789012",
			currencyCode: CurrencyCode.EUR, // "EUR"
			beneficiary: { name: "John Doe" },
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
		},
	],
});
```

##### Standing Order with Multiple Months

For standing orders that should execute in specific months, you can combine
multiple months using bitwise OR operators:

```js
import { encodeOptions } from "bysquare";
import {
	CurrencyCode,
	encode,
	Month,
	PaymentOptions,
	Periodicity,
} from "bysquare/pay";

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
			beneficiary: { name: "John Doe" },
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
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
			beneficiary: { name: "John Doe" },
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
		},
	],
});
```

> [!NOTE]
> **Date Format:** Provide date inputs (e.g., `paymentDueDate`, `lastDate`)
> in ISO 8601 format (`YYYY-MM-DD`). They are automatically converted to
> `YYYYMMDD` during encoding to match the Pay by Square specification.

</details>

<details>
<summary>Advanced usage</summary>

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
	type DataModel,
	decode,
	encode,
	PaymentOptions,
} from "bysquare/pay";

const data = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			currencyCode: CurrencyCode.EUR,
			amount: 100.0,
			variableSymbol: "123",
			paymentNote: "hello world",
			beneficiary: { name: "John Doe" },
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

</details>

### Invoice BySquare

In addition to PAY by square (payment QR codes), this library supports encoding
and decoding invoice documents (bysquareType=1). The invoice implementation was
reverse-engineered from the official Android application.

<details>
<summary>HTML example</summary>

This example shows how to generate an invoice QR code and display it in a web
page:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>Invoice QR Code</title>
	</head>
	<body>
		<div id="qrcode" style="width: 200px"></div>

		<script type="module">
			import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
			import { encode, InvoiceDocumentType } from "https://esm.sh/bysquare@latest/invoice";

			const qrstring = encode({
				documentType: InvoiceDocumentType.Invoice,
				invoiceId: "FV2024001",
				issueDate: "20240115",
				localCurrencyCode: "EUR",
				supplierParty: {
					partyName: "Supplier s.r.o.",
					postalAddress: {
						streetName: "Hlavna",
						cityName: "Bratislava",
						postalZone: "81101",
						country: "SVK",
					},
				},
				customerParty: {
					partyName: "Customer a.s.",
				},
				numberOfInvoiceLines: 1,
				taxCategorySummaries: [{
					classifiedTaxCategory: 0.2,
					taxExclusiveAmount: 100,
					taxAmount: 20,
				}],
				monetarySummary: {},
			});

			const qrElement = document.getElementById("qrcode");
			qrElement.appendChild(QRCode.generateSVG(qrstring));
		</script>
	</body>
</html>
```

</details>

<details>
<summary>Invoice Document Types</summary>

| Type            | Code | Description                |
| --------------- | ---- | -------------------------- |
| Invoice         | 0    | Standard invoice           |
| ProformaInvoice | 1    | Proforma (advance) invoice |
| CreditNote      | 2    | Credit note (reversal)     |
| DebitNote       | 3    | Debit note                 |
| AdvanceInvoice  | 4    | Advance invoice            |

</details>

<details>
<summary>Encode Invoice</summary>

```typescript
import {
	encode,
	type DataModel,
	InvoiceDocumentType,
} from "bysquare/invoice";

const invoice: DataModel = {
	documentType: InvoiceDocumentType.Invoice,
	invoiceId: "FV2024001",
	issueDate: "20240115",
	localCurrencyCode: "EUR",
	supplierParty: {
		partyName: "Supplier s.r.o.",
		postalAddress: {
			streetName: "Hlavna",
			cityName: "Bratislava",
			postalZone: "81101",
			country: "SVK",
		},
	},
	customerParty: {
		partyName: "Customer a.s.",
	},
	numberOfInvoiceLines: 3,
	taxCategorySummaries: [{
		classifiedTaxCategory: 0.2,
		taxExclusiveAmount: 100,
		taxAmount: 20,
	}],
	monetarySummary: {},
};

const qr = encode(invoice);
```

</details>

<details>
<summary>Decode Invoice</summary>

```typescript
import { decode } from "bysquare/invoice";

const invoice = decode(qr);

console.log(invoice.invoiceId);
console.log(invoice.documentType);
console.log(invoice.supplierParty.partyName);
```

</details>

<details>
<summary>Invoice Validation</summary>

`encode` validates the data model by default. Key validation rules:

- `invoiceId` and `issueDate` are required
- `localCurrencyCode` must be a 3-letter uppercase code (ISO 4217)
- Foreign currency fields (`foreignCurrencyCode`, `currRate`, `referenceCurrRate`)
  must all be present or all absent
- Supplier party requires `partyName` and postal address with `streetName`,
  `cityName`, `postalZone`, and `country`
- Customer party requires `partyName`
- Exactly one of `numberOfInvoiceLines` or `singleInvoiceLine` must be set
- At least one tax category summary is required with `classifiedTaxCategory`
  in range [0, 1]

Validation can be disabled:

```typescript
const qr = encode(invoice, { validate: false });
```

</details>

## Classifier Utilities

The library provides utility functions for working with multiple classifier
options as specified in the PAY by Square standard. These functions are
particularly useful for handling multiple month selections in standing orders.

### Encoding Multiple Options

```ts
import { encodeOptions } from "bysquare";
import { Month } from "bysquare/pay";

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

<image src="./docs/logic.excalidraw.svg" alt="encode" width="500px">

## Validation

This library uses **permissive validation** to ensure maximum compatibility with
various Slovak banking applications. The validation does not strictly enforce
all XSD schema restrictions.

### Validation Behavior

| Aspect           | Behavior                                                        |
| ---------------- | --------------------------------------------------------------- |
| IBAN             | Validated (format + checksum via ISO 13616)                     |
| BIC              | Validated (format via ISO 9362)                                 |
| Currency         | Validated (ISO 4217, case-insensitive, includes XXX)            |
| Date             | Validated (ISO 8601 format)                                     |
| Beneficiary name | Required (per spec v1.2.0)                                      |
| Symbols          | Permissive (accepts letters, spaces - XSD pattern not enforced) |
| Amounts          | Permissive (accepts negative values)                            |
| Field lengths    | Not enforced                                                    |

### XSD Field Constraints Reference

<https://www.bsqr.co/schema/>

For reference, the official XSD schema defines these constraints (not enforced
by this library):

| Field                             | Max Length | Pattern       |
| --------------------------------- | ---------- | ------------- |
| `variableSymbol`                  | 10         | `[0-9]{0,10}` |
| `constantSymbol`                  | 4          | `[0-9]{0,4}`  |
| `specificSymbol`                  | 10         | `[0-9]{0,10}` |
| `paymentNote`                     | 140        | -             |
| `originatorsReferenceInformation` | 35         | -             |
| `invoiceId`                       | 10         | -             |
| `beneficiary.name`                | 70         | -             |
| `beneficiary.street`              | 70         | -             |
| `beneficiary.city`                | 70         | -             |
| `mandateId`                       | 35         | -             |
| `creditorId`                      | 35         | -             |
| `contractId`                      | 35         | -             |
| `amount`                          | 15         | `>= 0`        |

## Related

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

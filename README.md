# bysquare

![version][version] ![build][build]

Simple JavaScript library to generate and parse "PAY by square" string.

**What is `PAY by square`?**

It's a national standard for QR code payments that was adopted by the Slovak
Banking Association in 2013. It is incorporated into a variety of invoices,
reminders and other payment regulations.

**Can I generate an image?**

This library doesn't have a specific opinion and how the QR code string is
transformed into images depends on how you implement it. See
[examples](examples).

## Install

**npm registry**

```sh
npm install bysquare
```

**GitHub**

```sh
# same as latest released npm registry version
npm install xseman/bysquare#master

# latest unreleased changes
npm install xseman/bysquare#develop

# specific tag version, e.g. v2.1.0
npm install xseman/bysquare#v2.1.0
```

**CLI**

```sh
npm install --global bysquare
```

**Deno** `v1.28+`, just import `npm:bysquare` `v2.1.0+`

```
import { generate, parse } from "npm:bysquare@2.1.0"
```

## How it works

### Encoding sequence

![logic](./docs/uml/logic.svg)

## API

```ts
generate(model: DataModel, options?: Options): string
parse(qr: string): DataModel
detect(qr: string): Boolean
```

## Usage

Generate

```ts
import { DataModel, generate, PaymentOptions } from "bysquare"

// long string ready to be encoded to QR
const qrString = generate({
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" }
			],
			currencyCode: "EUR",
			variableSymbol: "123"
		}
	]
})
```

Parse

```ts
import { parse } from "bysquare"

const model =
	parse("0405QH8090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000")

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

You can use json file with valid model to generate qr-string.

```sh
# example.json
# {
# 	"invoiceId": "random-id",
# 	"payments": [
# 		{
# 			"type": 1,
# 			"amount": 100.0,
# 			"bankAccounts": [{ "iban": "SK9611000000002918599669" }],
# 			"currencyCode": "EUR",
# 			"variableSymbol": "123"
# 		}
# 	]
# }

$ npx bysquare ./example.json
$ 0405QH8090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000
```

You can also use stdin.

```sh
$ npx bysquare <<< '{
    "invoiceId": "random-id",
    "payments": [
        {
            "type": 1,
            "amount": 100.0,
            "bankAccounts": [{ "iban": "SK9611000000002918599669" }],
            "currencyCode": "EUR",
            "variableSymbol": "123"
        }
    ]
}'

$ 0405QH8090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000
```

## Related

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.bsqr.co/schema/>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

<!--
Versioning
----------

https://github.com/dherges/npm-version-git-flow

- Stash unfinished work
- Run `npm test`
- Run `npm version <patch, minor, major>`
- Commit and push
- Follow git-flow instructions
- Checkout to master
- Build artefacts
- Push commits and tag, git push && git push --tags
- Validate with `npm publish --dry-run`
- Publish to npm, `npm publish`
-->

[build]: https://img.shields.io/github/actions/workflow/status/xseman/bysquare/tests.yml
[version]: https://img.shields.io/npm/v/bysquare

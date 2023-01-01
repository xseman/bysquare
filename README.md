# bysquare

![version][version] ![build][build]

Simple `Node.js` library to generate "PAY by square" `QR` string.

**What is `PAY by square`?**

It's a national standard for payment QR codes adopted by Slovak Banking
Association in 2013. It is part of a large number of invoices, reminders and
other payment regulations.

**Can I generate an image?**

This library is un-opinionated. Image generation from qr-code string depends on
your implementation. See [examples](examples).

## How it works

![diagram](./doc/uml/logic.svg)

## Install

npm registry

```sh
npm install bysquare
```

CLI

```sh
npm install --global bysquare
```

## API

```ts
generate(model: Model): Promise<string>
parse(qr: string): Promise<ParsedModel>
detect(qr: string): Boolean
```

**generate(model: Model): Promise\<string>**

```ts
import { generate, Model, parse, PaymentOptions } from "bysquare"

const model: Model = {
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: PaymentOptions.PaymentOrder,
	BankAccounts: 1,
}

generate(model).then((qr: string) => {
	// your logic...
})
```

**parse(qr: string): Promise\<ParsedModel>**

```ts
import { parse, ParsedModel } from "bysquare"

const qr = "0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"
parse(qr).then((model: ParsedModel) => {
	// your logic...
});
```

**detect(qr: string): Boolean**

```ts
import { detect } from "bysquare"

const qr = "0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0"
const isBysquare = detect(qr)
```

## CLI

You can use json file with valid model to generate qr-string.

```sh
# example.json
# {
#     "InvoiceID: "random-id",
#     "IBAN": "SK9611000000002918599669",
#     "Amount": 100.0,
#     "CurrencyCode": "EUR",
#     "VariableSymbol": "123",
#     "Payments": 1,
#     "PaymentOptions": 1,
#     "BankAccounts": 1
# }

$ npx bysquare ./example.json
$ 0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0
```

You can also use stdin.

```sh
$ bysquare <<< '{
	"InvoiceID": "random-id",
	"IBAN": "SK9611000000002918599669",
	"Amount": 100.0,
	"CurrencyCode": "EUR",
	"VariableSymbol": "123",
	"Payments": 1,
	"PaymentOptions": 1,
	"BankAccounts": 1
}'
$ 0004A00090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6C75G19O246KTT5G8LTLM67HOIATP4OOG8F8FDLJ6T26KFCB1690NEVPQVSG0
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
- Run `npm version`
- Follow git-flow instructions
- Checkout to master
- Push commits and tag, git push && git push --tags
- Validate with `npm publish --dry-run`
- Publish to npm, `npm publish`
-->

[build]: https://img.shields.io/github/actions/workflow/status/xseman/bysquare/tests.yml
[version]: https://img.shields.io/npm/v/bysquare

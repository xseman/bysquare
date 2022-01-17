# bysquare

![build][build] ![build][license] ![build][version]

<!-- Dependency free simple  -->

Simple `Node.js` library to generate "PAY by square" `QR` string.

**What is `PAY by square`?**

It's a national standard for payment QR codes adopted by Slovak Banking
Association (SBA) in 2013. It is part of a large number of invoices, reminders
and other payment regulations.

**Can I generate an image?**

This library is un-opinionated about generating images. Image generation from
qr-code string depends on your implementation. See the [examples](examples).

## Install

Node.js

```sh
npm install bysquare
```

## API

**Available functions**

### `generate(model: Model): Promise<string>`

```typescript
import { generate, Model } from 'bysquare';

const model: Model = {
    IBAN: 'SK9611000000002918599669',
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

generate(model).then((qrString) => {
    // your logic...
})
```

### `parse(qrString: string): Promise<Model>`

```typescript
import { parse } from 'bysquare';

const qr: string = '0005FO5V6G02NE0JSD04M4KD3R71IEMDHVJGQVQ6H573788QDK16QE2RLPHHHGVV7T9FG9OBDJI1V9MAE5A7B4T8FVVS9FOG00';

parse(qrString).then((parsed) => {
    // your logic...
});
```

<!-- ## How it works -->
<!-- TODO: diagram -->

## CLI

Local executable install

```sh
npm install --global bysquare
bysquare ./example.json
```

Executable without installation

```sh
npx bysquare ./example.json
```

**file**

```sh
bysquare ./example.json
```

```sh
$ 0005FO5V6G02NE0JSD04M4KD3R71IEMDHVJGQVQ6H573788QDK16QE2RLPHHHGVV7T9FG9OBDJI1V9MAE5A7B4T8FVVS9FOG00
```

**standard input**

```sh
$ echo '
    {
        "IBAN": "SK9611000000002918599669",
        "Amount": 100.0,
        "CurrencyCode": "EUR",
        "VariableSymbol": "123",
        "Payments": 1,
        "PaymentOptions": 1,
        "BankAccounts": 1
    }' \
| bysquare
```

```sh
$ 0005FO5V6G02NE0JSD04M4KD3R71IEMDHVJGQVQ6H573788QDK16QE2RLPHHHGVV7T9FG9OBDJI1V9MAE5A7B4T8FVVS9FOG00
```

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Contributors

![Contributors](https://contrib.rocks/image?repo=xseman/bysquare)

<!-- Links -->

[build]: https://img.shields.io/github/workflow/status/xseman/bysquare/tests
[version]: https://img.shields.io/npm/v/bysquare
[license]: https://img.shields.io/github/license/xseman/bysquare

## Resources

- <https://bysquare.com/>
- <https://github.com/matusf/pay-by-square>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>

<!--

Versioning
----------

- Stash unfinished work
- Run the `preversion` script
- Bump version in `package.json` as requested (patch, minor, major, etc)
- Build app
- Run the `version` script
- Commit and tag
- Run the `postversion` script
- Checkout to master
- Push commits and tag, git push, git push --tags
- Publish to npm, npm publish

-->

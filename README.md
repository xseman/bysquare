# bysquare

![build] ![license] ![version]

<!-- Dependency free simple  -->
Simple `Node.js` library to generate "PAY by square" `QR` string.

**What is `PAY by square`?**

It's a national standard for payment QR codes adopted by Slovak Banking
Association (SBA) in 2013. It is part of a large number of invoices, reminders
and other payment regulations.

**Can I generate an image?**

This library doesn't care about generating images, it's up to your
implementation to generate image from qr-code string. See the
[examples](examples).

## Why

I couldn't find any open-source implementation in Node.js. Something used by
thousands should be open and free.

## Status

Library is tagget as `v1.*` so its API must not be broken during some
improvements or refactoring.

## Node.js

```sh
npm install bysquare
```

## Usage

**Available functions**

**`generate`**

```typescript
function generate(model: Model): Promise<string>;
function generate(model: Model, cbResult: (qrString: string)): void;
```

<!-- **`parse`**

```typescript
function parse(qrString: string): Promise<Model>;
function parse(qrString: string, cbResult: (model: Model)): void;
``` -->

**Model**

```typescript
interface Model {
    /** Max length 10 */
    InvoiceID?: string;
    /** count */
    Payments: number;
    /**
     * Needs to be filled in with “paymentorder” option
     *
     * Max length 1
     */
    PaymentOptions: number;
    /**
     * Encoded with amount payable. This field is not required and can be left
     * blank in cases payment amount is not known ­such as donations.
     *
     * Max length 15
     * Format #.########
     */
    Amount?: number;
    /**
     * 3 letter, payment currency code according to ISO 4217
     *
     * Max length 3
     * Representation ISO 4217
     */
    CurrencyCode: keyof typeof CurrencyCode;
    /**
     * Optional field
     *
     * Max length 8
     * Format YYYYMMDD
     */
    PaymentDueDate?: string;
    /** Max length 10 */
    VariableSymbol?: string;
    /** Max length 4 */
    ConstantSymbol?: string;
    /** Max length 10 */
    SpecificSymbol?: string;
    /** Max length 35 */
    OriginatorsReferenceInformation?: string;
    /**
     * Optional field. In previous section we provide further recommendations
     * for encoding payment note.
     *
     * Max length 140
     */
    PaymentNote?: string;
    /**
     * In section „encoding BankAccounts“ we provide further recommendations for
     * encoding bank account
     */
    BankAccounts: number;
    /** Max length 34 */
    IBAN: string;
    /**
     * Max length 11
     * Format ISO 9362, 8 or 11 characters long
     */
    BIC?: string;
    /** Max length 1 */
    StandingOrderExt?: number;
    /**
     * This is the payment day. It‘s meaning depends on the periodicity, meaning
     * either day of the month (number between 1 and 31) or day of the week
     * (1=Monday,2=Tuesday, …, 7=Sunday).
     *
     * Max length 2
     * */
    Day?: number;
    /**
     * Selection of one or more months on which payment occurs. This is enabled
     * only if periodicity is set to one of the following value: “Weekly,
     * Biweekly, Monthly, Bimonthly”. Otherwise it must not be specified.
     *
     * Max length 4
     */
    Month?: number;
    /**
     * Periodicity of the payment. All valid options are „Daily“, „Weekly“,
     * „Biweekly“, „Monthly“, „Bimonthly“, „Quarterly“, „Annually“,
     * „Semiannually“. To find out which periodicity types are supported by the
     * banks see the following web site: http://www.sbaonline.sk/sk/
     *
     * Max length 1
     */
    Periodicity?: string;
    /**
     * Defines the day of the last payment of the standing order. After this
     * date, standing order is cancelled.
     *
     * Max length 8
     * Format YYYYMMDD
     */
    LastDate?: string;
    /** Max length 1 */
    DirectDebitExt?: number;
    /**
     * Tthis field can have “SEPA” value, if direct debit is using SEPA direct
     * debit scheme or “other” when an ordinary direct debit is defined
     *
     * Max length 1
     */
    DirectDebitScheme?: number;
    /**
     * Can be „one­off“ for one time debit or „recurrent“ for repeated debit
     * until cancelled.
     *
     * Max length 1
     */
    DirectDebitType?: number;
    /** Max length 10 */
    VariableSymbol_?: string;
    /** Max length 10 */
    SpecificSymbol_?: string;
    /** Max length 35 */
    OriginatorsReferenceInformation_?: string;
    /** Max length 35 */
    MandateID?: string;
    /** Max length 35 */
    CreditorID?: string;
    /** Max length 35 */
    ContractID?: string;
    /**
     * Optional field. As most users prefer to set up some maximum amount for
     * the direct debit, this can be pre­filled for them.
     *
     * Max length 15
     * Format #.########
     */
    MaxAmount?: number;
    /**
     * Defines the day after which direct debit is cancelled.
     *
     * Max length 8
     * Format YYYYMMDD
     */
    ValidTillDate?: string;
    /** Max length 70 */
    BeneficiaryName?: string;
    /** Max length 70 */
    BeneficiaryAddressLine1?: string;
    /** Max length 70 */
    BeneficiaryAddressLine2?: string;
}
```

## [Examples](examples)

**basic**

```javascript
const { generate } = require("bysquare");

const model = {
  IBAN: "SK9611000000002918599669",
  Amount: 100.0,
  CurrencyCode: "EUR",
  VariableSymbol: "123",
  Payments: 1,
  PaymentOptions: 1,
  BankAccounts: 1,
};

/** Callback */
generate(model, (result) => {
  // Your logic...
});

/** Promise */
(async () => {
  const result = await generate(model);
  // Your logic...
})();
```

**express + qrcodejs**

**`server`**

```javascript
const { generate } = require("bysquare");
const express = require("express");
const app = express();

const model = {
  IBAN: "SK9611000000002918599669",
  Amount: 100.0,
  CurrencyCode: "EUR",
  VariableSymbol: "123",
  Payments: 1,
  PaymentOptions: 1,
  BankAccounts: 1,
};

app.use("/", express.static("./public"));
app.get("/qr", async (_req, res) => {
  const qrString = await generate(model);
  res.send(qrString);
});

const port = 3_000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

**`curl test`**

```bash
curl http://localhost:3000/qr
0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000
```

**`client`**

```html
<!DOCTYPE html>
<html>
    <body>
        <h1>byquare simple example</h1>
        <div id="qrcode"></div>
    </body>
    <script src="qrcodejs.min.js"></script>
    <script type="text/javascript">
        const url = "http://localhost:3000/qr";
        fetch(url)
            .then((response) => response.text())
            .then((data) => {
                console.log(data);
                new QRCode(document.getElementById("qrcode"), data);
            });
    </script>
</html>
```

![clien-qr-image-generated]

## CLI

**npm**

Install binary locally

```sh
npm install --global bysquare
bysquare example.json
```

Without installation

```sh
npx bysquare example.json
```

**file**

```sh
bysquare example.json
```

**standard input**

```sh
echo '
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

**qrcode-terminal**

The scannable qr-code will be generated as ascii art to the terminal.

```sh
bysquare example.json | npx qrcode-terminal
```

![terminal-usage-image]

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Other resources

- <https://bysquare.com/>
- <https://github.com/matusf/pay-by-square>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>

[build]: https://img.shields.io/github/workflow/status/xseman/bysquare/Node.js%20CI
[version]: https://img.shields.io/npm/v/bysquare
[license]: https://img.shields.io/github/license/xseman/bysquare
[clien-qr-image-generated]: ./examples/express/output.png
[terminal-usage-image]: ./examples/cli/example_qrcode_terminal.png

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
- Push tag, changes, git push --tags
- Publish to npm, npm publish

-->

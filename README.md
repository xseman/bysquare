bysquare
========

Simple library to generate `PAY by square` QR string from simple object literal.

`PAY by square` is standard for encoding of payment information into QR codes in
Slovakia.

Install
-------

```bash
npm i bysquare
```

Usage
-----

```javascript
const generate = require('bysquare').generate;

generate(
    {
        IBAN: "SK9611000000002918599669",
        Amount: 100.0,
        CurrencyCode: "EUR",
        VariableSymbol: "123",
        Payments: 1,
        PaymentOptions: 1,
        BankAccounts: 1,
    },
    (result) => {
        // Your logic...
    }
);
```

Model

```typescript
interface Model {
    /** Max length 10 */
    InvoiceID?: string,
    /** count */
    Payments: number,
    /** Max length 1 */
    PaymentOptions: number,
    /**
     * Max length 15
     * Format #.########
     * */
    Amount: number,
    /**
     * Max length 3
     * Representation ISO 4217
     *  */
    CurrencyCode: CurrencyCodes,
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    PaymentDueDate?: string,
    /** Max length 10 */
    VariableSymbol?: string,
    /** Max length 4 */
    ConstantSymbol?: string,
    /** Max length 10 */
    SpecificSymbol?: string,
    /** Max length 35 */
    OriginatorsReferenceInformation?: string,
    /** Max length 140 */
    PaymentNote?: string,
    /** count */
    BankAccounts: number,
    /** Max length 34 */
    IBAN: string,
    /**
     * Max length 11
     * Format ISO 9362, 8 or 11 characters long
     * */
    BIC?: string,
    /** Max length 1 */
    StandingOrderExt?: number,
    /** Max length 2 */
    Day?: number,
    /** Max length 4 */
    Month?: number,
    /** Max length 1 */
    Periodicity?: string,
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    LastDate?: string,
    /** Max length 1 */
    DirectDebitExt?: number,
    /** Max length 1 */
    DirectDebitScheme?: number,
    /** Max length 1 */
    DirectDebitType?: number,
    /** Max length 10 */
    VariableSymbol_?: string,
    /** Max length 10 */
    SpecificSymbol_?: string,
    /** Max length 35 */
    OriginatorsReferenceInformation_?: string,
    /** Max length 35 */
    MandateID?: string,
    /** Max length 35 */
    CreditorID?: string,
    /** Max length 35 */
    ContractID?: string,
    /**
     * Max length 15
     * Format #.########
     * */
    MaxAmount?: number,
    /**
     * Max length 8
     * Format YYYYMMDD
     */
    ValidTillDate?: string,
    /** Max length 70 */
    BeneficiaryName?: string,
    /** Max length 70 */
    BeneficiaryAddressLine1?: string,
    /** Max length 70 */
    BeneficiaryAddressLine2?: string,
}
```

License
-------

Distributed under the MIT License. See `LICENSE` for more information.

Contact
-------

Filip Seman - seman.filip@gmail.com

References
----------

- <https://bysquare.com/>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>

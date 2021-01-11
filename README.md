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

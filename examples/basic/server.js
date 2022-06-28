const { generate } = require("bysquare");

/** @type {import("bysquare").Model} */
const model = {
    IBAN: "SK9611000000002918599669",
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

generate(model).then((qrString) => {
    console.log(qrString);
});

const { generate } = require('bysquare');

const model = {
    IBAN: "SK9611000000002918599669",
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

generate(model, (result) => {
    console.log(result);
    // Your logic...
});

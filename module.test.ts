import { strictEqual } from "assert";

import { generate, Model } from "./module";

const model: Model = {
    IBAN: "SK9611000000002918599669",
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

const expectedResult = "0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000";

/** Callback */
generate(model, (result) => {
    strictEqual(result, expectedResult);
});

/** Promise */
(async () => {
    const result = await generate(model);
    strictEqual(result, expectedResult);
})();

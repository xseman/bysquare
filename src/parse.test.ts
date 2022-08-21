import { expect, test } from "vitest"

import { Model, parse } from "."

test("Parse model from qr-string", async () => {
	const expectedModel: Model = {
		IBAN: "SK9611000000002918599669",
		Amount: 100.0,
		CurrencyCode: "EUR",
		VariableSymbol: "123",
		Payments: 1,
		PaymentOptions: 1,
		BankAccounts: 1
	}

	// prettier-ignore
	const qrString = "0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000"
	const parsedModel = await parse(qrString)

	expect(parsedModel).toStrictEqual(expectedModel)
})

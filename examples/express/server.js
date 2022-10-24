import { generate, PaymentOptions } from "bysquare"
// import { generate } from "./../../lib/index.js"
import express from "express"

const publicFolder = express.static("./public")
const app = express()

/** @type {import("bysquare").Model} */
const model = {
	InvoiceID: "random-string",
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: PaymentOptions.PaymentOrder,
	BankAccounts: 1,
	BeneficiaryName: "Filip",
	BeneficiaryAddressLine1: "Address",
	BeneficiaryAddressLine2: "City"
}

app.use("/", publicFolder)
app.get("/qr", async (_req, res) => {
	const qrString = await generate(model)
	res.send(qrString)
})

const port = 3_000
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})

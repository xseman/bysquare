import { generate, PaymentOptions } from "bysquare"
// import { generate } from "./../../lib/index.js"
import express from "express"

const app = express()

const publicFolder = express.static("./public")
app.use("/", publicFolder)

/** @type {import("bysquare").Model} */
const model = {
	InvoiceID: "123",
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

app.get("/qr", async (_req, res) => {
	const qrstring = await generate(model)
	console.log(qrstring);
	res.send(qrstring)
})

const port = 4_000
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})

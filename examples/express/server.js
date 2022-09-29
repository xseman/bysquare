import { generate } from "bysquare"
// import { generate } from "./../../lib/index.js"
import express from "express"

const publicFolder = express.static("./public")
const app = express()

/** @type {import("bysquare").Model} */
const model = {
	IBAN: "SK9611000000002918599669",
	Amount: 100.0,
	CurrencyCode: "EUR",
	VariableSymbol: "123",
	Payments: 1,
	PaymentOptions: 1,
	BankAccounts: 1
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

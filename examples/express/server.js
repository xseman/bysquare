// import { generate, PaymentOptionsEnum } from "./../../lib/index.js"
import { generate, PaymentOptions } from "bysquare"
import express from "express"

const app = express()

const publicFolder = express.static("./public")
app.use("/", publicFolder)

/** @type {import("bysquare").DataModel} */
const model = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" },
			],
			currencyCode: "EUR",
			variableSymbol: "123",
			beneficiary: {
				name: "Filip",
				city: "City",
				street: "Street"
			}
		}
	]
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

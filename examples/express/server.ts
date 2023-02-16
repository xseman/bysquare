// import { DataModel, generate, PaymentOptions } from "./../../lib/index.js"
import { DataModel, generate, PaymentOptions } from "bysquare"
import express from "express"

const model = {
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{ iban: "SK9611000000002918599669" }
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
} satisfies DataModel

const publicFolder = express.static("./public")
const app = express()

app.use("/", publicFolder)

app.get("/qr", async (_req, res) => {
	const qrstring = await generate(model)
	console.log(qrstring)
	res.send(qrstring)
})

const port = 4_000
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})

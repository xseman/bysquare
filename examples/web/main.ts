import { generate } from "bysquare"

// FIXME:
// -> The package "path" wasn't found on the file system but is built into node.
// -> return require(require("path").join(__dirname, "src" ,"lzma_worker.js")).LZMA_WORKER

const model = generate({
	invoiceId: "id",
	payments: [
		{
			type: 1,
			amount: 100.0,
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
			currencyCode: "EUR",
			variableSymbol: "123"
		}
	]
})

console.log(model)

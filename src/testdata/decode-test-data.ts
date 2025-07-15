import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
} from "../types.js";

// QR String to DataModel mappings for testing decode functionality
export const decodeTestCases = new Map<string, DataModel>([
	[
		"0004I0006UC5LT8E21H3IC1K9R40P82GJL22NTU0586BBEOEKDMQSVUUBAOP1C0FFE14UJA1F1LJMV0FONE35J05TRC77FTIMV87NKNANNOFJB684000",
		{
			invoiceId: "2015001",
			payments: [{
				amount: 25.30,
				currencyCode: CurrencyCode.EUR,
				type: PaymentOptions.PaymentOrder,
				bankAccounts: [{ iban: "SK4523585719461382368397" }],
				beneficiary: { name: "John Doe" },
			}],
		},
	],
	[
		"00054000DG4GL2L1JL66N01P4GCBG05KQEPULNMP9EB7MEE935VG4P4B1BDBN7MV4GU13R7DMGU9O93QEI2KQJLPTFFU7GJNP6QL0UADVHOQ3B0OP0OO5P4L58M918PG00",
		{
			invoiceId: "2015001",
			payments: [{
				amount: 45.55,
				currencyCode: CurrencyCode.EUR,
				type: PaymentOptions.PaymentOrder,
				bankAccounts: [{ iban: "SK2738545237537948273958" }],
				beneficiary: { name: "Jane Doe" },
				paymentNote: "bendzín",
			}],
		},
	],
]);

export const invalidBase32HexStrings = [
	"á",
	"x",
	"y",
	"w",
	"z",
];

export const serializedDataWithMissingIban = /** dprint-ignore */ [
	"random-id",
	"\t", "1",
	"\t", "1",
	"\t", "100",
	"\t", "EUR",
	"\t",
	"\t", "123",
	"\t",
	"\t",
	"\t",
	"\t",
	"\t", "1",
	"\t", "",
	"\t",
	"\t", "0",
	"\t", "0",
	"\t",
	"\t",
	"\t",
].join("");

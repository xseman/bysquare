import {
	CurrencyCode,
	Periodicity,
} from "../types.js";

// Valid bank account for testing
export const validBankAccount = {
	iban: "LC14BOSL123456789012345678901234",
};

// Helper function input data
export const simplePaymentInputData = {
	amount: 100,
	variableSymbol: "123456",
	currencyCode: CurrencyCode.EUR,
	iban: "SK9611000000002918599669",
};

export const directDebitInputData = {
	amount: 200,
	variableSymbol: "123456",
	currencyCode: CurrencyCode.EUR,
	iban: "SK9611000000002918599669",
};

export const standingOrderInputData = {
	day: 1,
	amount: 300,
	variableSymbol: "123456",
	currencyCode: CurrencyCode.EUR,
	periodicity: Periodicity.Monthly,
	iban: "SK9611000000002918599669",
};

// Expected QR strings for helper function tests
export const expectedQrStrings = {
	simplePayment:
		"0003U00006N21P0493146TIU1LLOG3NUHM9AGHB75BR8RTSCFLRGUDIAQQC523GA26TB6TNEKPOG8K7MRJ1QE17P76JVVVVSVG600",
	directDebit:
		"0004U000AA4LB98G9C4VRFN3JBLGE302PV9QJOL1B9C1SUVULR936DRQIRC6HRR9SC93SVPAGCN8VFM8C002BCOH5V86VT0ITKFVVTN68000",
	standingOrder:
		"0004A000BGNH3FVNBR5UJOKTTUULHGVT2D3GM45EVMIEA183DE3QO3VGDA23R813CHG1PKT91T72KVD02SPT0JBTJVOG5GA17VG1RVVVVHE2000",
};

// Expected checksum data
export const expectedChecksumData = Uint8Array.from([
	0x90,
	0x94,
	0x19,
	0x21,
	0x72,
	0x61,
	0x6e,
	0x64,
	0x6f,
	0x6d,
	0x2d,
	0x69,
	0x64,
	0x09,
	0x31,
	0x09,
	0x31,
	0x09,
	0x31,
	0x30,
	0x30,
	0x09,
	0x45,
	0x55,
	0x52,
	0x09,
	0x09,
	0x31,
	0x32,
	0x33,
	0x09,
	0x09,
	0x09,
	0x09,
	0x09,
	0x31,
	0x09,
	0x53,
	0x4b,
	0x39,
	0x36,
	0x31,
	0x31,
	0x30,
	0x30,
	0x30,
	0x30,
	0x30,
	0x30,
	0x30,
	0x30,
	0x32,
	0x39,
	0x31,
	0x38,
	0x35,
	0x39,
	0x39,
	0x36,
	0x36,
	0x39,
	0x09,
	0x09,
	0x30,
	0x09,
	0x30,
	0x09,
	0x09,
	0x09,
]);

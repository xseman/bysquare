import assert from "node:assert/strict";
import {
	describe,
	test,
} from "node:test";

import {
	directDebit,
	simplePayment,
	standingOrder,
} from "./helpers.js";
import {
	CurrencyCode,
	Periodicity,
} from "./types.js";

describe("helpers", () => {
	test("simplePayment", () => {
		const input = {
			amount: 100,
			variableSymbol: "123456",
			currencyCode: CurrencyCode.EUR,
			iban: "SK9611000000002918599669",
		};

		const qrstring = simplePayment(input);

		assert.equal(
			qrstring,
			"0003U00006N21P0493146TIU1LLOG3NUHM9AGHB75BR8RTSCFLRGUDIAQQC523GA26TB6TNEKPOG8K7MRJ1QE17P76JVVVVSVG600",
		);
	});

	test("directDebit", () => {
		const input = {
			amount: 200,
			variableSymbol: "123456",
			currencyCode: CurrencyCode.EUR,
			iban: "SK9611000000002918599669",
		};

		const qrstring = directDebit(input);

		assert.equal(
			qrstring,
			"0004U000AA4LB98G9C4VRFN3JBLGE302PV9QJOL1B9C1SUVULR936DRQIRC6HRR9SC93SVPAGCN8VFM8C002BCOH5V86VT0ITKFVVTN68000",
		);
	});

	test("standingOrder", () => {
		const input = {
			day: 1,
			amount: 300,
			variableSymbol: "123456",
			currencyCode: CurrencyCode.EUR,
			periodicity: Periodicity.Monthly,
			iban: "SK9611000000002918599669",
		};

		const qrstring = standingOrder(input);

		assert.equal(
			qrstring,
			"0004A000BGNH3FVNBR5UJOKTTUULHGVT2D3GM45EVMIEA183DE3QO3VGDA23R813CHG1PKT91T72KVD02SPT0JBTJVOG5GA17VG1RVVVVHE2000",
		);
	});
});

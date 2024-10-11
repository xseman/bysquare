import assert from "node:assert";
import test, { describe } from "node:test";

import {
	decode,
	DecodeError,
	DecodeErrorMessage,
	deserialize,
	detect,
	safeDecompress,
	validateBysquareHeader,
} from "./decode.js";
import { encode } from "./encode.js";
import {
	payloadWithDirectDebit,
	payloadWithPaymentOrder,
	payloadWithStandingOrder,
	serializedDirectDebit,
	serializedPaymentOrder,
	serializedStandingOrder,
} from "./test_assets.js";
import {
	CurrencyCode,
	DataModel,
	PaymentOptions,
	Version,
} from "./types.js";

test("decode", () => {
	const encoded = encode(payloadWithPaymentOrder);
	const decoded = decode(encoded);

	assert.deepEqual(decoded, payloadWithPaymentOrder);
});

test("decode - invalid input (throw)", () => {
	assert.throws(() => {
		decode("aaaa");
	}, { message: "Invalid base32hex string" });
});

test("decode - bidirectional", () => {
	const qrString = encode(payloadWithPaymentOrder);

	assert.deepEqual(payloadWithPaymentOrder, decode(qrString));
});

describe("decode - validateBysquareHeader", () => {
	test("throws for invalid version", () => {
		const version = (Version["1.1.0"] + 1) as Version;
		assert.throws(() => {
			validateBysquareHeader({
				bysquareType: 0,
				documentType: 0,
				reserved: 0,
				version,
			});
		}, new DecodeError(DecodeErrorMessage.UnsupportedVersion, { version }));
	});
	test("passes for valid version", () => {
		assert.doesNotThrow(() =>
			validateBysquareHeader({
				bysquareType: 0,
				documentType: 0,
				reserved: 0,
				version: Version["1.1.0"],
			})
		);
	});
});

describe("decode - deserialize", () => {
	test("throws missing IBAN error", () => {
		const serialized = /** dprint-ignore */ [
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

		assert.throws(
			() => deserialize(serialized),
			new DecodeError(DecodeErrorMessage.MissingIBAN),
		);
	});
	test("return decoded payment order", () => {
		assert.deepEqual(
			deserialize(serializedPaymentOrder),
			payloadWithPaymentOrder,
		);
	});
	test("return decoded standing order", () => {
		assert.deepEqual(
			deserialize(serializedStandingOrder),
			payloadWithStandingOrder,
		);
	});
	test("return decoded direct debit", () => {
		assert.deepEqual(
			deserialize(serializedDirectDebit),
			payloadWithDirectDebit,
		);
	});
});

describe("decode - detect", () => {
	test("detect invalid header", () => {
		const isBysquare = detect("");

		assert.equal(isBysquare, false);
	});
	test("detect valid header", () => {
		const encoded = encode(payloadWithPaymentOrder);
		const isBysquare = detect(encoded);

		assert.equal(isBysquare, true);
	});
});

test("detect - invalid header data", () => {
	const notBysquare = detect("EHIN6T0=" /** "test" in base32hex */);
	assert.equal(notBysquare, false);

	/** invalid header */
	assert.equal(detect("aaaa"), false);

	/** these throw an error in the base32hex decoder */
	assert.equal(detect("á"), false);
	assert.equal(detect("x"), false);
	assert.equal(detect("y"), false);
	assert.equal(detect("w"), false);
	assert.equal(detect("z"), false);
});

test("decode - multiple data", () => {
	const data = new Map<string, DataModel>([
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

	for (const [qr, encoded] of data) {
		const decoded = decode(qr);
		assert.deepEqual(decoded, encoded);
	}
});

test("decode - safeDecompress", () => {
	test("throws for invalid body", () => {
		assert.throws(
			() => safeDecompress(new Uint8Array([0])),
			(err) => {
				assert(err instanceof DecodeError);
				assert(err.message, DecodeErrorMessage.LZMADecompressionFailed);
				assert(err.extensions?.error);
				return true;
			},
		);
	});
});

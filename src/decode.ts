import { decompress } from "lzma1";
import { base32hex } from "rfc4648";
import {
	BankAccount,
	Beneficiary,
	CurrencyCode,
	DataModel,
	Day,
	Payment,
	PaymentOptions,
	Periodicity,
	Version,
} from "./index.js";

function cleanUndefined(obj: any): void {
	Object.keys(obj).forEach((key) => {
		if (typeof obj[key] === "undefined") {
			delete obj[key];
		}
	});
}

/**
 * Generating by square Code
 *
 * @see 3.14.
 */
export function deserialize(qr: string): DataModel {
	const serialized = qr.split("\t");
	const invoiceId = serialized.shift();
	const output: DataModel = {
		invoiceId: invoiceId?.length ? invoiceId : undefined,
		payments: [],
	};

	const paymentslen = Number(serialized.shift());
	for (let i = 0; i < paymentslen; i++) {
		const paymentOptions = serialized.shift();
		const ammount = serialized.shift();
		const currency = serialized.shift();
		const dueDate = serialized.shift();
		const variables = serialized.shift();
		const constants = serialized.shift();
		const specifics = serialized.shift();
		const originatorRefInfo = serialized.shift();
		const paymentNote = serialized.shift();

		let payment: Payment = {
			bankAccounts: [],
			type: Number(paymentOptions) as PaymentOptions,
			currencyCode: currency as CurrencyCode,
			amount: ammount?.length
				? Number(ammount)
				: undefined,
			paymentDueDate: dueDate?.length
				? dueDate
				: undefined,
			variableSymbol: variables?.length
				? variables
				: undefined,
			constantSymbol: constants?.length
				? constants
				: undefined,
			specificSymbol: specifics?.length
				? specifics
				: undefined,
			originatorsReferenceInformation: originatorRefInfo?.length
				? originatorRefInfo
				: undefined,
			paymentNote: paymentNote?.length
				? paymentNote
				: undefined,
		};

		const accountslen = Number(serialized.shift());
		for (let j = 0; j < accountslen; j++) {
			const iban = serialized.shift();
			if (iban === undefined || iban.length === 0) {
				throw new Error("Missing IBAN");
			}

			const bic = serialized.shift();
			const account = {
				iban: iban,
				bic: bic?.length
					? bic
					: undefined,
			} satisfies BankAccount;
			cleanUndefined(account);
			payment.bankAccounts.push(account);
		}

		serialized.shift(); // StandingOrderExt
		serialized.shift(); // DirectDebitExt

		// narrowing payment type
		switch (payment.type) {
			case PaymentOptions.PaymentOrder:
				break;

			case PaymentOptions.StandingOrder:
				payment = {
					...payment,
					day: Number(serialized.shift()) as Day,
					month: Number(serialized.shift()),
					periodicity: serialized.shift() as Periodicity,
					lastDate: serialized.shift(),
				};
				break;

			case PaymentOptions.DirectDebit:
				payment = {
					...payment,
					directDebitScheme: Number(serialized.shift()),
					directDebitType: Number(serialized.shift()),
					mandateId: serialized.shift(),
					creditorId: serialized.shift(),
					contractId: serialized.shift(),
					maxAmount: Number(serialized.shift()),
					validTillDate: serialized.shift(),
				};
				break;

			default:
				break;
		}
		cleanUndefined(payment);
		output.payments.push(payment);
	}

	for (let i = 0; i < paymentslen; i++) {
		const name = serialized.shift();
		const addressLine1 = serialized.shift();
		const addressLine2 = serialized.shift();

		if (Boolean(name) || Boolean(addressLine1) || Boolean(addressLine2)) {
			const beneficiary = {
				name: name?.length
					? name
					: undefined,
				street: addressLine1?.length
					? addressLine1
					: undefined,
				city: addressLine2?.length
					? addressLine2
					: undefined,
			} satisfies Beneficiary;

			cleanUndefined(beneficiary);
			output.payments[i].beneficiary = beneficiary;
		}
	}

	return output;
}

/**
 * The function uses bit-shifting and masking to convert the first two bytes of
 * the input header array into four nibbles representing the bysquare header
 * values.
 *
 * @param header 2-bytes sie
 */
function bysquareHeaderDecoder(header: Uint8Array) {
	const bytes = (header[0] << 8) | header[1];
	const bysquareType = bytes >> 12;
	const version = (bytes >> 8) & 0b0000_1111;
	const documentType = (bytes >> 4) & 0b0000_1111;
	const reserved = bytes & 0b0000_1111;

	return {
		bysquareType,
		version,
		documentType,
		reserved,
	};
}

export class DecodeError extends Error {
	override name = "DecodeError";
	constructor(public cause: Error, msg?: string) {
		super(msg);
	}
}

/** @deprecated */
export const parse = decode;

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 */
export function decode(qr: string): DataModel {
	try {
		var bytes = base32hex.parse(qr, {
			loose: true,
		});
	}
	catch (error) {
		throw new DecodeError(
			error,
			"Unable to decode QR string base32hex encoding",
		);
	}

	const bysquareHeader = bytes.slice(0, 2);
	if ((bysquareHeaderDecoder(bysquareHeader).version > Version["1.1.0"])) {
		throw new Error("Unsupported Bysquare version");
	}

	/**
	 * The process of decompressing data requires the addition of an LZMA header
	 * to the compressed data. This header is necessary for the decompression
	 * algorithm to properly interpret and extract the original uncompressed
	 * data. Bysquare only store properties
	 *
	 * <----------------------- 13-bytes ----------------------->
	 *
	 * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
	 * | Properties |  Dictionary Size  |   Uncompressed Size   |
	 * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
	 */
	const defaultProperties = [0x5D]; // lc=3, lp=0, pb=2
	const defaultDictionarySize = [0x00, 0x02, 0x00, 0x00]; // 2^17

	const uncompressedSize = new Uint8Array(8);
	uncompressedSize.set(bytes.slice(2, 4));

	const header = new Uint8Array([
		...defaultProperties,
		...defaultDictionarySize,
		...uncompressedSize,
	]);

	const payload = bytes.slice(4);
	const body = new Uint8Array([
		...header,
		...payload,
	]);

	try {
		var decompressed = new Uint8Array(decompress(body) as Int8Array);
	}
	catch (error) {
		throw new DecodeError(error, "LZMA decompression failed");
	}

	const _checksum = decompressed.slice(0, 4);
	const decompressedBody = decompressed.slice(4);
	const decoded = new TextDecoder("utf-8").decode(decompressedBody);

	return deserialize(decoded);
}

/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export function detect(qr: string): boolean {
	try {
		var parsed = base32hex.parse(qr, {
			loose: true,
		});
	}
	catch {
		throw new Error("Invalid data, Unable to decode base32hex QR string");
	}

	if (parsed.byteLength < 2) {
		return false;
	}

	const bysquareHeader = parsed.subarray(0, 2);
	const {
		bysquareType,
		version,
		documentType,
		reserved,
	} = bysquareHeaderDecoder(bysquareHeader);

	const isValid = [bysquareType, version, documentType, reserved]
		.every((nibble, index) => {
			if (index === 1) {
				return nibble <= Version["1.1.0"];
			}

			return 0x00 <= nibble && nibble <= 0x0F;
		});

	return isValid;
}

import { decompress } from "lzma1";

import * as base32hex from "./base32hex.js";
import {
	BankAccount,
	Beneficiary,
	CurrencyCode,
	DataModel,
	Day,
	type DirectDebit,
	Payment,
	PaymentOptions,
	Periodicity,
	type StandingOrder,
	Version,
} from "./index.js";

export enum DecodeErrorMessage {
	MissingIBAN = "IBAN is missing",
	/**
	 * @description - find original LZMA error in extensions
	 */
	LZMADecompressionFailed = "LZMA decompression failed",
	/**
	 * @description - find found version in extensions
	 * @see {@link ./types#Version} for valid ranges
	 */
	UnsupportedVersion = "Unsupported version",
}

export class DecodeError extends Error {
	override name = "DecodeError";
	public extensions?: { [name: string]: any; };

	constructor(message: DecodeErrorMessage, extensions?: { [name: string]: any; }) {
		super(message);
		if (extensions) {
			this.extensions = extensions;
		}
	}
}

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
	const data = qr.split("\t");
	const invoiceId = data.shift();

	const output = {
		invoiceId: invoiceId?.length ? invoiceId : undefined,
		payments: new Array<Payment>(),
	} satisfies DataModel;

	const paymentslen = Number(data.shift());
	for (let i = 0; i < paymentslen; i++) {
		const paymentOptions = data.shift();
		const ammount = data.shift();
		const currency = data.shift();
		const dueDate = data.shift();
		const variables = data.shift();
		const constants = data.shift();
		const specifics = data.shift();
		const originatorRefInfo = data.shift();
		const paymentNote = data.shift();

		let payment: Payment = {
			bankAccounts: [],
			type: Number(paymentOptions),
			currencyCode: currency ?? CurrencyCode.EUR,
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

		const accountslen = Number(data.shift());
		for (let j = 0; j < accountslen; j++) {
			const iban = data.shift();
			if (iban === undefined || iban.length === 0) {
				throw new DecodeError(DecodeErrorMessage.MissingIBAN);
			}

			const bic = data.shift();
			const account = {
				iban: iban,
				bic: bic?.length
					? bic
					: undefined,
			} satisfies BankAccount;

			cleanUndefined(account);
			payment.bankAccounts.push(account);
		}

		data.shift(); // StandingOrderExt
		data.shift(); // DirectDebitExt

		// narrowing payment type
		switch (payment.type) {
			case PaymentOptions.PaymentOrder:
				break;

			case PaymentOptions.StandingOrder:
				// todo: missing test
				payment = {
					...payment,
					day: Number(data.shift()) as Day,
					month: Number(data.shift()),
					periodicity: data.shift() as Periodicity,
					lastDate: data.shift(),
				} satisfies StandingOrder;
				break;

			case PaymentOptions.DirectDebit:
				// todo: missing test
				payment = {
					...payment,
					directDebitScheme: Number(data.shift()),
					directDebitType: Number(data.shift()),
					mandateId: data.shift(),
					creditorId: data.shift(),
					contractId: data.shift(),
					maxAmount: Number(data.shift()),
					validTillDate: data.shift(),
				} satisfies DirectDebit;
				break;

			default:
				break;
		}

		cleanUndefined(payment);
		output.payments.push(payment);
	}

	for (let i = 0; i < paymentslen; i++) {
		const name = data.shift();
		const addressLine1 = data.shift();
		const addressLine2 = data.shift();

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

interface Header {
	bysquareType: number;
	version: number;
	documentType: number;
	reserved: number;
}

/**
 * The function uses bit-shifting and masking to convert the first two bytes of
 * the input header array into four nibbles representing the bysquare header
 * values.
 *
 * @param header 2-bytes size
 */
function bysquareHeaderDecoder(header: Uint8Array): Header {
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

/** @deprecated */
export const parse = decode;

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 */
export function decode(qr: string): DataModel {
	const bytes = base32hex.decode(qr);
	const bysquareHeader = bytes.slice(0, 2);
	const decodedBysquareHeader = bysquareHeaderDecoder(bysquareHeader);
	if ((decodedBysquareHeader.version > Version["1.1.0"])) {
		// todo: missing test
		throw new DecodeError(DecodeErrorMessage.UnsupportedVersion, {
			version: decodedBysquareHeader.version,
		});
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

	let decompressed: string | Int8Array | undefined;
	try {
		decompressed = decompress(body);
	} catch (error) {
		// todo: missing test
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, { error });
	}

	if (typeof decompressed === "string") {
		// todo: missing test
		return deserialize(decompressed);
	}

	const _checksum = decompressed.slice(0, 4);
	const decompressedBody = decompressed.slice(4);
	const decoded = new TextDecoder("utf-8").decode(decompressedBody.buffer);

	return deserialize(decoded);
}

/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export function detect(qr: string): boolean {
	let decoded: Uint8Array;
	try {
		decoded = base32hex.decode(qr, true);
	} catch (error) {
		// todo: missing test
		return false;
	}

	if (decoded.byteLength < 2) {
		// todo: missing test
		return false;
	}

	const bysquareHeader = decoded.subarray(0, 2);
	const header = bysquareHeaderDecoder(bysquareHeader);

	const isValid = [
		header.bysquareType,
		header.version,
		header.documentType,
		header.reserved,
	].every((nibble, index) => {
		if (index === 1) {
			return nibble <= Version["1.1.0"];
		}

		return 0x00 <= nibble && nibble <= 0x0F;
	});

	return isValid;
}

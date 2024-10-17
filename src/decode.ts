import { decompress } from "lzma1";

import * as base32hex from "./base32hex.js";
import {
	BankAccount,
	Beneficiary,
	CurrencyCode,
	DataModel,
	type DirectDebit,
	Payment,
	PaymentOptions,
	type Periodicity,
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

function decodeNumber(value: string | undefined): number | undefined {
	return value?.length ? Number(value) : undefined;
}

function decodeString(value: string | undefined): string | undefined {
	return value?.length ? value : undefined;
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
		const variableSymbol = data.shift();
		const constantSymbol = data.shift();
		const specificSymbol = data.shift();
		const originatorRefInfo = data.shift();
		const paymentNote = data.shift();

		let payment = {
			bankAccounts: [],
			type: Number(paymentOptions),
			currencyCode: currency ?? CurrencyCode.EUR,
			amount: Number(ammount),
			paymentDueDate: dueDate || undefined,
			variableSymbol: variableSymbol || undefined,
			constantSymbol: constantSymbol || undefined,
			specificSymbol: specificSymbol || undefined,
			originatorsReferenceInformation: originatorRefInfo || undefined,
			paymentNote: paymentNote || undefined,
		} as Payment;

		const numberOfAccounts = Number(data.shift());

		for (let j = 0; j < numberOfAccounts; j++) {
			const iban = data.shift();
			if (iban === undefined || iban.length === 0) {
				throw new DecodeError(DecodeErrorMessage.MissingIBAN);
			}

			const bic = data.shift();
			const account = {
				iban: iban,
				bic: bic || undefined,
			} satisfies BankAccount;

			cleanUndefined(account);
			payment.bankAccounts.push(account);
		}

		const standingOrderExt = data.shift();
		if (standingOrderExt === "1" && payment.type === PaymentOptions.StandingOrder) {
			payment = {
				...payment,
				day: decodeNumber(data.shift()),
				month: decodeNumber(data.shift()),
				periodicity: decodeString(data.shift()) as Periodicity,
				lastDate: decodeString(data.shift()),
			} satisfies StandingOrder;
		}

		const directDebitExt = data.shift();
		if (directDebitExt === "1" && payment.type === PaymentOptions.DirectDebit) {
			payment = {
				...payment,
				directDebitScheme: decodeNumber(data.shift()),
				directDebitType: decodeNumber(data.shift()),
				variableSymbol: decodeString(data.shift()),
				specificSymbol: decodeString(data.shift()),
				originatorsReferenceInformation: decodeString(data.shift()),
				mandateId: decodeString(data.shift()),
				creditorId: decodeString(data.shift()),
				contractId: decodeString(data.shift()),
				maxAmount: decodeNumber(data.shift()),
				validTillDate: decodeString(data.shift()),
			} satisfies DirectDebit;
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
				name: name || undefined,
				street: addressLine1 || undefined,
				city: addressLine2 || undefined,
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
	 * @see https://docs.fileformat.com/compression/lzma/
	 *
	 * +---------------+---------------------------+-------------------+
	 * |      1B       |           4B              |         8B        |
	 * +---------------+---------------------------+-------------------+
	 * | Properties    | Dictionary Size           | Uncompressed Size |
	 * +---------------+---------------------------+-------------------+
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
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, { error });
	}

	if (typeof decompressed === "string") {
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
 * There is not magic header in the bysquare specification.
 * Version is just 4 bites, so it is possible to have false positives.
 */
export function detect(qr: string): boolean {
	let decoded: Uint8Array;
	try {
		decoded = base32hex.decode(qr, true);
	} catch (error) {
		return false;
	}

	if (decoded.byteLength < 2) {
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

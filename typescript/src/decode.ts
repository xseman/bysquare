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

export const DecodeErrorMessage = {
	MissingIBAN: "IBAN is missing",
	/**
	 * @description - find original LZMA error in extensions
	 */
	LZMADecompressionFailed: "LZMA decompression failed",
	/**
	 * @description - find found version in extensions
	 * @see {@link ./types#Version} for valid ranges
	 */
	UnsupportedVersion: "Unsupported version",
} as const;

export class DecodeError extends Error {
	public extensions?: { [name: string]: any; };

	constructor(
		message: string,
		extensions?: { [name: string]: any; },
	) {
		super(message);
		this.name = this.constructor.name;

		if (extensions) {
			this.extensions = extensions;
		}
	}
}

function decodeNumber(value: string | undefined): number | undefined {
	return value?.length ? Number(value) : undefined;
}

function decodeString(value: string | undefined): string | undefined {
	return value?.length ? value : undefined;
}

/**
 * Converts date from YYYYMMDD format to ISO 8601 format (YYYY-MM-DD)
 * per Pay by Square specification section 3.7.
 *
 * Note: This conversion is only used for paymentDueDate per specification.
 * lastDate remains in YYYYMMDD format.
 *
 * @param input - Date in YYYYMMDD format
 * @returns Date in ISO 8601 format (YYYY-MM-DD) | undefined
 */
function deserializeDate(input?: string): string | undefined {
	if (!input || input.length !== 8) {
		return undefined;
	}

	const year = input.slice(0, 4);
	const month = input.slice(4, 6);
	const day = input.slice(6, 8);

	return year + "-" + month + "-" + day;
}

/**
 * Parse a tab-separated intermediate format into DataModel.
 *
 * Base fields
 * - Field 0: invoiceId
 * - Field 1: paymentsCount
 *
 * Payment block (repeated `paymentsCount` times)
 * - Field +0: type
 * - Field +1: amount
 * - Field +2: currencyCode
 * - Field +3: paymentDueDate (YYYYMMDD)
 * - Field +4: variableSymbol
 * - Field +5: constantSymbol
 * - Field +6: specificSymbol
 * - Field +7: originatorsReferenceInformation
 * - Field +8: paymentNote
 * - Field +9: bankAccountsCount
 *
 * Bank account block (nested, repeated `bankAccountsCount` times)
 * - Field +0: iban
 * - Field +1: bic
 *
 * Standing order extension
 * - Field +X: standingOrderExt ("0" | "1")
 *   - if "1":
 *     - Field +1: day
 *     - Field +2: month (classifier sum)
 *     - Field +3: periodicity
 *     - Field +4: lastDate (YYYYMMDD)
 *
 * Direct debit extension
 * - Field +Y: directDebitExt ("0" | "1")
 *   - if "1":
 *     - Field +1: directDebitScheme
 *     - Field +2: directDebitType
 *     - Field +3: variableSymbol
 *     - Field +4: specificSymbol
 *     - Field +5: originatorsReferenceInformation
 *     - Field +6: mandateId
 *     - Field +7: creditorId
 *     - Field +8: contractId
 *     - Field +9: maxAmount
 *     - Field +10: validTillDate
 *
 * Beneficiary block (repeated per payment)
 * - Field +0: beneficiaryName
 * - Field +1: beneficiaryStreet
 * - Field +2: beneficiaryCity
 *
 * @see 3.14
 * @see Table 15
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
			type: Number(paymentOptions),
			currencyCode: currency ?? CurrencyCode.EUR,
			amount: Number(ammount),
			paymentDueDate: deserializeDate(dueDate),
			variableSymbol: variableSymbol || undefined,
			constantSymbol: constantSymbol || undefined,
			specificSymbol: specificSymbol || undefined,
			originatorsReferenceInformation: originatorRefInfo || undefined,
			paymentNote: paymentNote || undefined,
			bankAccounts: [],
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

			payment.bankAccounts.push(account);
		}

		const standingOrderExt = data.shift();
		if (standingOrderExt === "1" && payment.type === PaymentOptions.StandingOrder) {
			payment = {
				...payment,
				day: decodeNumber(data.shift()),
				month: decodeNumber(data.shift()),
				periodicity: decodeString(data.shift()) as Periodicity,
				// lastDate stays in YYYYMMDD format (not converted per specification)
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
 * Extracts the 4 nibbles from a 2-byte bysquare header using bit-shifting and
 * masking.
 *
 * ```
 * | Attribute    | Number of bits | Possible values | Note
 * --------------------------------------------------------------------------------------------
 * | BySquareType | 4              | 0-15            | by square type
 * | Version      | 4              | 0-15            | version of the by square type
 * | DocumentType | 4              | 0-15            | document type within given by square type
 * | Reserved     | 4              | 0-15            | bits reserved for future needs
 * ```
 *
 * @param header 2-bytes size
 * @see 3.5.
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

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 * @param qr base32hex encoded bysqaure binary data
 */
export function decode(qr: string): DataModel {
	const bytes = base32hex.decode(qr);
	const headerBytes = bytes.slice(0, 2);
	const headerData = bysquareHeaderDecoder(headerBytes);

	if ((headerData.version > Version["1.1.0"])) {
		throw new DecodeError(DecodeErrorMessage.UnsupportedVersion, {
			version: headerData.version,
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
	const defaultDictionarySize = [0x00, 0x00, 0x20, 0x00]; // 2^21 = 2097152

	// Parse the payload length from bytes 2-3 and properly expand to 8-byte uncompressed size
	const payloadLengthBytes = bytes.slice(2, 4);
	const payloadLength = payloadLengthBytes[0] | (payloadLengthBytes[1] << 8);

	const uncompressedSize = new Uint8Array(8);
	// Set the full 32-bit value in little-endian format
	uncompressedSize[0] = payloadLength & 0xFF;
	uncompressedSize[1] = (payloadLength >> 8) & 0xFF;
	uncompressedSize[2] = (payloadLength >> 16) & 0xFF;
	uncompressedSize[3] = (payloadLength >> 24) & 0xFF;
	// Bytes 4-7 remain 0 for sizes < 2^32

	const header = [
		...defaultProperties,
		...defaultDictionarySize,
		...uncompressedSize,
	];

	const payload = bytes.slice(4);
	const body = new Uint8Array([
		...header,
		...payload,
	]);

	let decompressed: Uint8Array | undefined;
	try {
		decompressed = decompress(body);
	} catch (error) {
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, { error });
	}

	if (!decompressed) {
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, {
			error: "Decompression returned undefined",
		});
	}

	// Extract checksum and body
	const _checksum = decompressed.slice(0, 4);
	const decompressedBody = decompressed.slice(4);
	const decoded = new TextDecoder("utf-8").decode(decompressedBody.buffer);

	return deserialize(decoded);
}

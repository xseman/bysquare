import { compress } from "lzma1";

import * as base32hex from "./base32hex.js";
import { crc32 } from "./crc32.js";
import { deburr } from "./deburr.js";
import {
	DataModel,
	Month,
	PaymentOptions,
	Version,
} from "./types.js";
import { validateDataModel } from "./validations.js";

/**
 * Converts date from ISO 8601 format (YYYY-MM-DD) to YYYYMMDD format
 * per Pay by Square specification section 3.7.
 *
 * Note: This conversion is only used for paymentDueDate per specification.
 * lastDate expects YYYYMMDD format directly.
 *
 * @param input - Date in ISO 8601 format (YYYY-MM-DD)
 * @returns Date in YYYYMMDD format | undefined
 */
function serializeDate(input?: string): string | undefined {
	if (!input) {
		return undefined;
	}

	return input.split("-").join("");
}

export const EncodeErrorMessage = {
	/**
	 * @description - find invalid value in extensions
	 */
	BySquareType: "Invalid BySquareType value in header, valid range <0,15>",

	/**
	 * @description - find invalid value in extensions
	 * @see {@link ./types#Version} for valid ranges
	 */
	Version: "Invalid Version value in header",

	/**
	 * @description - find invalid value in extensions
	 */
	DocumentType: "Invalid DocumentType value in header, valid range <0,15>",

	/**
	 * @description - find invalid value in extensions
	 */
	Reserved: "Invalid Reserved value in header, valid range <0,15>",

	/**
	 * @description - find actual size of header in extensions
	 * @see MAX_COMPRESSED_SIZE
	 */
	HeaderDataSize: "Allowed header data size exceeded",
} as const;

export class EncodeError extends Error {
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

export const MAX_COMPRESSED_SIZE = 131_072; // 2^17

/**
 * Returns a 2 byte buffer that represents the header of the bysquare
 * specification
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
 * @see 3.5.
 */
export function buildBysquareHeader(
	/** dprint-ignore */
	header: [
		bySquareType: number, version: number,
		documentType: number, reserved: number
	] = [
		0x00, 0x00,
		0x00, 0x00
	],
): number[] {
	if (header[0] < 0 || header[0] > 15) {
		throw new EncodeError(EncodeErrorMessage.BySquareType, { invalidValue: header[0] });
	}
	if (header[1] < 0 || header[1] > 15) {
		throw new EncodeError(EncodeErrorMessage.Version, { invalidValue: header[1] });
	}
	if (header[2] < 0 || header[2] > 15) {
		throw new EncodeError(EncodeErrorMessage.DocumentType, { invalidValue: header[2] });
	}
	if (header[3] < 0 || header[3] > 15) {
		throw new EncodeError(EncodeErrorMessage.Reserved, { invalidValue: header[3] });
	}

	const [
		bySquareType,
		version,
		documentType,
		reserved,
	] = header;

	// Combine 4-nibbles to 2-bytes
	const mergedNibbles = [
		(bySquareType << 4) | (version << 0),
		(documentType << 4) | (reserved << 0),
	];

	return mergedNibbles;
}

/**
 * Creates a 2-byte array that represents the length of compressed data in
 * combination with CRC32 in bytes.
 *
 * ```
 * +---------------+---------------+
 * |    Byte 0     |    Byte 1     |
 * +---------------+---------------+
 * |  LSB (0-255)  | MSB (0-511)   |
 * +---------------+---------------+
 * | Little-endian 16-bit unsigned |
 * +-------------------------------+
 * ```
 *
 * @see 3.6.
 */
export function buildPayloadLength(length: number): Uint8Array {
	if (length >= MAX_COMPRESSED_SIZE) {
		throw new EncodeError(EncodeErrorMessage.HeaderDataSize, {
			actualSize: length,
			allowedSize: MAX_COMPRESSED_SIZE,
		});
	}

	const header = new ArrayBuffer(2);
	new DataView(header).setUint16(0, length, true);

	return new Uint8Array(header);
}

/**
 * Prepends a 4-byte CRC32 checksum to the tab-separated payload.
 *
 * ```
 * +------------------+---------------------------+
 * |      4 bytes     |        Variable           |
 * +------------------+---------------------------+
 * | CRC32 Checksum   | Tab-separated payload     |
 * | (little-endian)  | (UTF-8 encoded)           |
 * +------------------+---------------------------+
 * ```
 *
 * @see 3.10.
 */
export function addChecksum(tabbedPayload: string): Uint8Array {
	const checksum = new ArrayBuffer(4);
	new DataView(checksum).setUint32(0, crc32(tabbedPayload), true);

	const byteArray = new TextEncoder().encode(tabbedPayload);

	return Uint8Array.from([
		...new Uint8Array(checksum),
		...Uint8Array.from(byteArray),
	]);
}

/**
 * Transform DataModel to a tab-separated intermediate format.
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
 * @see Table 15
 */
export function serialize(data: DataModel): string {
	const serialized = new Array<string | undefined>();

	serialized.push(data.invoiceId?.toString());
	serialized.push(data.payments.length.toString());

	for (const p of data.payments) {
		serialized.push(p.type.toString());
		serialized.push(p.amount?.toString());
		serialized.push(p.currencyCode);
		serialized.push(serializeDate(p.paymentDueDate));
		serialized.push(p.variableSymbol);
		serialized.push(p.constantSymbol);
		serialized.push(p.specificSymbol);
		serialized.push(p.originatorsReferenceInformation);
		serialized.push(p.paymentNote);

		serialized.push(p.bankAccounts.length.toString());
		for (const ba of p.bankAccounts) {
			serialized.push(ba.iban);
			serialized.push(ba.bic);
		}

		// Standing Order extension
		// Check if payment type is Standing Order
		if (p.type === PaymentOptions.StandingOrder) {
			serialized.push("1");
			serialized.push(p.day?.toString());

			// Month classifier
			// Check if it's a number, use it directly, otherwise convert key to number
			const monthValue = p.month;
			if (typeof monthValue === "string") {
				// Convert month key to numeric value
				serialized.push(Month[monthValue as keyof typeof Month]?.toString());
			} else {
				// Use numeric value directly (already encoded classifier sum)
				serialized.push(monthValue?.toString());
			}

			serialized.push(p.periodicity);
			serialized.push(p.lastDate);
		} else {
			serialized.push("0");
		}

		// Direct Debit extension
		// Check if payment type is Direct Debit
		if (p.type === PaymentOptions.DirectDebit) {
			serialized.push("1");
			serialized.push(p.directDebitScheme?.toString());
			serialized.push(p.directDebitType?.toString());
			serialized.push(p.variableSymbol?.toString());
			serialized.push(p.specificSymbol?.toString());
			serialized.push(p.originatorsReferenceInformation?.toString());
			serialized.push(p.mandateId?.toString());
			serialized.push(p.creditorId?.toString());
			serialized.push(p.contractId?.toString());
			serialized.push(p.maxAmount?.toString());
			serialized.push(p.validTillDate?.toString());
		} else {
			serialized.push("0");
		}
	}

	for (const p of data.payments) {
		serialized.push(p.beneficiary?.name);
		serialized.push(p.beneficiary?.street);
		serialized.push(p.beneficiary?.city);
	}

	return serialized.join("\t");
}

export function removeDiacritics(model: DataModel): void {
	for (const payment of model.payments) {
		if (payment.paymentNote) {
			payment.paymentNote = deburr(payment.paymentNote);
		}

		if (payment.beneficiary?.name) {
			payment.beneficiary.name = deburr(payment.beneficiary.name);
		}

		if (payment.beneficiary?.city) {
			payment.beneficiary.city = deburr(payment.beneficiary.city);
		}

		if (payment.beneficiary?.street) {
			payment.beneficiary.street = deburr(payment.beneficiary.street);
		}
	}
}

type Options = {
	/**
	 * Many banking apps do not support diacritics, which results in errors when
	 * serializing data from QR codes.
	 *
	 * @default true
	 */
	deburr?: boolean;

	/**
	 * If true, validates the data model before encoding it.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Version of the BySquare format to use.
	 *
	 * Note: Version 1.1.0 adds beneficiary name and address fields but is not
	 * supported by all banking apps (e.g., TatraBanka). Use 1.0.0 for better
	 * compatibility.
	 *
	 * @default Version["1.0.0"]
	 */
	version?: Version;
};

/**
 * Generate QR string ready for encoding into text QR code.
 *
 * Complete BySquare QR binary structure:
 * ```
 * +------------------+------------------+-----------------------------+
 * |     2 bytes      |     2 bytes      |          Variable           |
 * +------------------+------------------+-----------------------------+
 * | Bysquare Header  | Payload Length   |         LZMA Body           |
 * | (4 nibbles)      | (little-endian)  |  (compressed CRC+payload)   |
 * +------------------+------------------+-----------------------------+
 *         |                  |                       |
 *         v                  v                       v
 * +-----+-----+-----+-----+  +-----+-----+  +---------+-----------+
 * | 4b  | 4b  | 4b  | 4b  |  | LSB | MSB |  | Header  | Body      |
 * +-----+-----+-----+-----+  +-----+-----+  | (13B)   | (var)     |
 * | Type| Ver | Doc |Resv |  |   Length  |  | omitted |           |
 * +-----+-----+-----+-----+  +-----------+  +---------+-----------+
 *                                                       |
 *                                                       v
 *                                           +--------+-------------+
 *                                           | CRC32  | Tab-sep     |
 *                                           | (4B)   | payload     |
 *                                           +--------+-------------+
 * ```
 *
 * @param model - Data model to encode
 * @param options - Options for encoding
 *
 * @default options.deburr - true
 * @default options.validate - true
 *
 * @see 3.16.
 */
export function encode(
	model: DataModel,
	options: Options = { deburr: true, validate: true },
): string {
	if (options.deburr) {
		removeDiacritics(model);
	}

	if (options.validate) {
		validateDataModel(model);
	}

	const payloadTabbed = serialize(model);
	const payloadChecked = addChecksum(payloadTabbed);
	const payloadCompressed = compress(payloadChecked);

	/**
	 * Header is ommited, the bysquare doesn't include it in the output
	 *
	 * ---
	 * The LZMA files has a 13-byte header that is followed by the LZMA
	 * compressed data.
	 *
	 * NOTE: We use a custom compression function that sets dictionary size to 2^17
	 * This is required for compatibility with existing QR codes
	 *
	 * @see https://docs.fileformat.com/compression/lzma/
	 *
	 * +---------------+---------------------------+-------------------+
	 * |      1B       |           4B              |         8B        |
	 * +---------------+---------------------------+-------------------+
	 * | Properties    | Dictionary Size           | Uncompressed Size |
	 * +---------------+---------------------------+-------------------+
	 */
	const _lzmaHeader = payloadCompressed.subarray(0, 13);
	const lzmaBody = payloadCompressed.subarray(13);

	const version = options.version ?? Version["1.0.0"];

	const output = new Uint8Array([
		...buildBysquareHeader([0x00, version, 0x00, 0x00]),
		...buildPayloadLength(payloadChecked.byteLength),
		...lzmaBody,
	]);

	return base32hex.encode(output, false);
}

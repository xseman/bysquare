import { compress } from "lzma1";

import * as base32hex from "../base32hex.js";
import { deburr } from "../deburr.js";
import {
	addChecksum,
	buildBysquareHeader,
	buildPayloadLength,
} from "../header.js";
import { Version } from "../types.js";
import {
	DataModel,
	Month,
	PaymentOptions,
} from "./types.js";
import { validateDataModel } from "./validations.js";

/**
 * Sanitize field value by replacing tab characters with space.
 *
 * @see 3.8.
 */
function sanitize(value: string | undefined): string | undefined {
	return value?.replaceAll("\t", " ");
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
	const s = new Array<string | undefined>();

	// Base fields
	s.push(sanitize(data.invoiceId?.toString()));
	s.push(data.payments.length.toString());

	for (const p of data.payments) {
		// Payment fields
		s.push(p.type.toString());
		s.push(p.amount?.toString());
		s.push(sanitize(p.currencyCode));
		s.push(sanitize(p.paymentDueDate));
		s.push(sanitize(p.variableSymbol));
		s.push(sanitize(p.constantSymbol));
		s.push(sanitize(p.specificSymbol));
		s.push(sanitize(p.originatorsReferenceInformation));
		s.push(sanitize(p.paymentNote));

		// Bank accounts
		s.push(p.bankAccounts.length.toString());
		for (const ba of p.bankAccounts) {
			s.push(sanitize(ba.iban));
			s.push(sanitize(ba.bic));
		}

		// Standing order extension
		if (p.type === PaymentOptions.StandingOrder) {
			s.push("1");
			s.push(p.day?.toString());

			const monthValue = p.month;
			if (typeof monthValue === "string") {
				s.push(Month[monthValue as keyof typeof Month]?.toString());
			} else {
				s.push(monthValue?.toString());
			}

			s.push(sanitize(p.periodicity));
			s.push(sanitize(p.lastDate));
		} else {
			s.push("0");
		}

		// Direct debit extension
		if (p.type === PaymentOptions.DirectDebit) {
			s.push("1");
			s.push(p.directDebitScheme?.toString());
			s.push(p.directDebitType?.toString());
			s.push(sanitize(p.ddVariableSymbol?.toString()));
			s.push(sanitize(p.ddSpecificSymbol?.toString()));
			s.push(sanitize(p.ddOriginatorsReferenceInformation?.toString()));
			s.push(sanitize(p.mandateId?.toString()));
			s.push(sanitize(p.creditorId?.toString()));
			s.push(sanitize(p.contractId?.toString()));
			s.push(p.maxAmount?.toString());
			s.push(sanitize(p.validTillDate?.toString()));
		} else {
			s.push("0");
		}
	}

	// Beneficiary block (after all payments)
	for (const p of data.payments) {
		s.push(sanitize(p.beneficiary?.name));
		s.push(sanitize(p.beneficiary?.street));
		s.push(sanitize(p.beneficiary?.city));
	}

	return s.join("\t");
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

export type EncodeOptions = {
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
	 * Note: Version 1.2.0 requires beneficiary name. Earlier versions (1.0.0, 1.1.0)
	 * do not require it but may have limited banking app support for beneficiary fields.
	 *
	 * @default Version["1.2.0"]
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
	options: EncodeOptions = { deburr: true, validate: true },
): string {
	if (options.deburr) {
		removeDiacritics(model);
	}

	const version = options.version ?? Version["1.2.0"];

	if (options.validate) {
		validateDataModel(model, version);
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

	const output = new Uint8Array([
		...buildBysquareHeader([0x00, version, 0x00, 0x00]),
		...buildPayloadLength(payloadChecked.byteLength),
		...lzmaBody,
	]);

	return base32hex.encode(output, false);
}

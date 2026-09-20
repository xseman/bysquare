import * as base32hex from "../base32hex.js";
import { crc32 } from "../crc32.js";
import {
	decodeNumber,
	decodeString,
} from "../field.js";
import {
	DecodeError,
	DecodeErrorMessage,
	decodeHeader,
} from "../header.js";
import * as lzma from "../lzma.js";
import { Version } from "../types.js";
import {
	BankAccount,
	CurrencyCode,
	DataModel,
	type DirectDebit,
	Payment,
	PaymentOptions,
	type Periodicity,
	type StandingOrder,
} from "./types.js";

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
export function deserialize(tabString: string): DataModel {
	const data = tabString.split("\t");
	let i = 0;

	function next(): string | undefined {
		return data[i++];
	}

	// Base fields
	const invoiceId = decodeString(next());
	// A count never exceeds the fields left; a foreign payload (an invoice fed
	// to this decoder) would otherwise ask for millions of empty payments.
	const paymentsCount = Math.min(Number(next()), data.length);

	const payments = new Array<Payment>();

	for (let p = 0; p < paymentsCount; p++) {
		// Payment fields
		const type = Number(next()) as PaymentOptions;
		const amount = Number(next());
		const currencyCode = next() ?? CurrencyCode.EUR;
		const paymentDueDate = decodeString(next());
		const variableSymbol = decodeString(next());
		const constantSymbol = decodeString(next());
		const specificSymbol = decodeString(next());
		const originatorsReferenceInformation = decodeString(next());
		const paymentNote = decodeString(next());

		// Bank accounts
		const bankAccountsCount = Math.min(Number(next()), data.length);
		const bankAccounts: BankAccount[] = [];

		for (let j = 0; j < bankAccountsCount; j++) {
			const iban = next();
			if (iban === undefined || iban.length === 0) {
				throw new DecodeError(DecodeErrorMessage.MissingIBAN);
			}

			const bic = decodeString(next());
			bankAccounts.push({ iban, bic });
		}

		let payment = {
			type: type,
			amount: amount,
			currencyCode: currencyCode,
			paymentDueDate: paymentDueDate,
			variableSymbol: variableSymbol,
			constantSymbol: constantSymbol,
			specificSymbol: specificSymbol,
			originatorsReferenceInformation: originatorsReferenceInformation,
			paymentNote: paymentNote,
			bankAccounts: bankAccounts,
			beneficiary: { name: "" },
		} as Payment;

		// Standing order extension — fields must be consumed whenever the
		// flag is "1" regardless of payment type to keep data aligned.
		const standingOrderExt = next();
		if (standingOrderExt === "1") {
			const day = decodeNumber(next());
			const month = decodeNumber(next());
			const periodicity = decodeString(next()) as Periodicity;
			const lastDate = decodeString(next());

			if (type === PaymentOptions.StandingOrder) {
				payment = {
					...payment,
					day: day,
					month: month,
					periodicity: periodicity,
					lastDate: lastDate,
				} as StandingOrder;
			}
		}

		// Direct debit extension — fields must be consumed whenever the
		// flag is "1" regardless of payment type to keep data aligned.
		const directDebitExt = next();
		if (directDebitExt === "1") {
			const directDebitScheme = decodeNumber(next());
			const directDebitType = decodeNumber(next());
			const ddVariableSymbol = decodeString(next());
			const ddSpecificSymbol = decodeString(next());
			const ddOriginatorsReferenceInformation = decodeString(next());
			const mandateId = decodeString(next());
			const creditorId = decodeString(next());
			const contractId = decodeString(next());
			const maxAmount = decodeNumber(next());
			const validTillDate = decodeString(next());

			if (type === PaymentOptions.DirectDebit) {
				payment = {
					...payment,
					directDebitScheme: directDebitScheme,
					directDebitType: directDebitType,
					ddVariableSymbol: ddVariableSymbol,
					ddSpecificSymbol: ddSpecificSymbol,
					ddOriginatorsReferenceInformation: ddOriginatorsReferenceInformation,
					mandateId: mandateId,
					creditorId: creditorId,
					contractId: contractId,
					maxAmount: maxAmount,
					validTillDate: validTillDate,
				} as DirectDebit;
			}
		}

		payments.push(payment);
	}

	// Beneficiary block (after all payments)
	for (let p = 0; p < paymentsCount; p++) {
		const name = next() ?? "";
		const street = decodeString(next());
		const city = decodeString(next());

		payments[p].beneficiary = {
			name: name,
			street: street,
			city: city,
		};
	}

	return {
		invoiceId,
		payments,
	};
}

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * Input binary structure (after base32hex decoding):
 * ```
 * +------------------+------------------+-----------------------------+
 * |     2 bytes      |     2 bytes      |          Variable           |
 * +------------------+------------------+-----------------------------+
 * | Bysquare Header  | Payload Length   |         LZMA Body           |
 * | (4 nibbles)      | (little-endian)  |  (compressed CRC+payload)   |
 * +------------------+------------------+-----------------------------+
 * ```
 *
 * After LZMA decompression:
 * ```
 * +------------------+---------------------------+
 * |      4 bytes     |        Variable           |
 * +------------------+---------------------------+
 * | CRC32 Checksum   | Tab-separated payload     |
 * | (little-endian)  | (UTF-8 encoded)           |
 * +------------------+---------------------------+
 * ```
 *
 * @see 3.16.
 * @param qr base32hex encoded bysquare binary data
 */
export function decode(qr: string): DataModel {
	const bytes = base32hex.decode(qr);
	const headerBytes = bytes.slice(0, 2);
	const headerData = decodeHeader(headerBytes);

	if ((headerData.version > Version["1.2.0"])) {
		throw new DecodeError(DecodeErrorMessage.UnsupportedVersion, {
			version: headerData.version,
		});
	}

	const payloadLength = bytes[2] | (bytes[3] << 8);
	const decompressed = lzma.decompress(bytes.slice(4), payloadLength);

	if (decompressed.byteLength < 4) {
		throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, {
			error: "Decompressed payload is shorter than the CRC32 checksum",
		});
	}

	// Extract checksum and body
	const checksumBytes = decompressed.slice(0, 4);
	const decompressedBody = decompressed.slice(4);
	const decoded = new TextDecoder("utf-8").decode(decompressedBody.buffer);

	// Verify CRC32 checksum integrity
	const storedChecksum = new DataView(checksumBytes.buffer, checksumBytes.byteOffset, 4)
		.getUint32(0, true);

	const computedChecksum = crc32(decoded);
	if (storedChecksum !== computedChecksum) {
		throw new DecodeError("CRC32 checksum mismatch", {
			stored: storedChecksum,
			computed: computedChecksum,
		});
	}

	return deserialize(decoded);
}

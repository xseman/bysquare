import * as lzma from "lzma-native"

import { SUBST } from "./generate"
import {
	CurrencyCode,
	DirectDebitScheme,
	DirectDebitType,
	ParsedModel,
	PaymentOptions,
	PeriodicityClassifier
} from "./index"

const INVOICE_ORDER = 0
const NUMBER_OF_PAYMENTS_ORDER = 1

/**
 * Generating by square Code
 *
 * @see {spec 3.14.}
 */
export function assemble(tabbed: string): ParsedModel {
	const fields: string[] = tabbed
		.split("\t")
		/** The end of the qr-string might contain a NULL-terminated string */
		.map((entry) => entry.replace("\x00", ""))

	const invoiceId = fields[INVOICE_ORDER]
	const numberOfPayments = Number(fields[NUMBER_OF_PAYMENTS_ORDER])

	/**
	 * For the first payment, it always starts at index 2 of the parsed tabbed
	 * string
	 */
	let order = 2

	const output: ParsedModel = {
		invoiceID: !!invoiceId.length ? invoiceId : undefined,
		payments: []
	}

	for (let i = 0; i < numberOfPayments; i++) {
		const paymentOptions = Number(fields[order++ + i]) as PaymentOptions
		const ammount = fields[order++ + i]

		const currencyCode = fields[order++ + i]
		if (currencyCode.length !== 3) {
			throw new Error("Invalid currency code")
		}

		const paymentDueDate = fields[order++ + i]
		const variableSymbol = fields[order++ + i]
		const constantSymbol = fields[order++ + i]
		const specificSymbol = fields[order++ + i]
		const originatorsReferenceInformation = fields[order++ + i]
		const paymentNote = fields[order++ + i]

		output.payments.push({
			amount: !!ammount.length
				? Number(ammount)
				: undefined,

			currencyCode: currencyCode as keyof typeof CurrencyCode,

			paymentDueDate: !!paymentDueDate.length
				? paymentDueDate
				: undefined,

			variableSymbol: !!variableSymbol.length
				? variableSymbol
				: undefined,

			constantSymbol: !!constantSymbol.length
				? constantSymbol
				: undefined,

			specificSymbol: !!specificSymbol.length
				? specificSymbol
				: undefined,

			originatorsReferenceInformation: !!originatorsReferenceInformation.length
				? originatorsReferenceInformation
				: undefined,

			paymentNote: !!paymentNote.length
				? paymentNote
				: undefined,

			bankAccounts: []
		})

		const numberOfBankAccounts = Number(fields[order++ + i])
		for (let j = 0; j < numberOfBankAccounts; j++) {
			const iban = fields[order++ + i]
			if (iban.length === 0) {
				throw new Error("Missing IBAN")
			}

			const bic = fields[order++ + i]

			output.payments[i].bankAccounts.push({
				iban: iban,
				bic: bic.length ? bic : undefined
			})
		}

		switch (paymentOptions) {
			case PaymentOptions.PAYMENTORDER:
				order += 2 /** skip 2 fields */
				break

			case PaymentOptions.STANDINGORDER:
				output.payments[i].standingOrder = {
					day: Number(fields[order++ + i]),
					month: Number(fields[order++ + i]),
					periodicity: fields[order++ + i] as PeriodicityClassifier,
					lastDate: fields[order++ + i]
				}
				break

			case PaymentOptions.DIRECTDEBIT:
				output.payments[i].directDebit = {
					directDebitScheme: Number(fields[order++ + i]) as DirectDebitScheme,
					directDebitType: Number(fields[order++ + i]) as DirectDebitType,
					variableSymbol: fields[order++ + i],
					specificSymbol: fields[order++ + i],
					originatorsReferenceInformation: fields[order++ + i],
					mandateID: fields[order++ + i],
					creditorID: fields[order++ + i],
					contractID: fields[order++ + i],
					maxAmount: Number(fields[order++ + i]),
					validTillDate: fields[order++ + i]
				}

			default:
				throw new Error("Unknown payment option")
		}
	}

	/**
	 * Beneficiary list bysquare v1.1
	 */
	for (let i = 0; i < numberOfPayments; i++) {
		const name = fields[order++ + i]
		const addressLine1 = fields[order++ + i]
		const addressLine2 = fields[order++ + i]

		if (!name && !addressLine1 && !addressLine2) {
			break
		}

		output.payments[i].beneficiary = {
			name: name.length ? name : undefined,
			addressLine1: addressLine1.length ? addressLine1 : undefined,
			addressLine2: addressLine2.length ? addressLine2 : undefined
		}
	}

	return output
}

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see {spec 3.16.}
 */
export function parse(qr: string): Promise<ParsedModel> {
	const inversed: Buffer = inverseAlphanumericConversion(qr)
	const _headerBysquare = inversed.slice(0, 2)
	const _headerCompression = inversed.slice(2, 4)
	const compressedData = inversed.slice(4)

	// @ts-ignore: Missing decored types
	const decoder = lzma.createStream("rawDecoder", {
		synchronous: true,
		// @ts-ignore: Missing filter types
		filters: [{ id: lzma.FILTER_LZMA1 }]
	})

	return new Promise<ParsedModel>((resolve, reject) => {
		decoder
			.on("error", reject)
			.on("data", (decompress: Buffer): void => {
				const _crc32: Buffer = decompress.slice(0, 4)
				const tabbed: string = decompress.slice(4).toString()
				const model: ParsedModel = assemble(tabbed)

				resolve(model)
			})
			.write(compressedData, (error): void => {
				error && reject(error)
				decoder.end()
			})
	})
}

/**
 * Reverse alphanumeric conversion using Base32hex
 *
 * @see {spec 3.13.}
 */
export function inverseAlphanumericConversion(qr: string): Buffer {
	const binary: string = [...qr].reduce((acc, char) => {
		acc += SUBST.indexOf(char).toString(2).padStart(5, "0")
		return acc
	}, "")

	let bytes: number[] = []
	for (let nth = 0, leftCount = 0; binary.length > leftCount; nth++) {
		/** string representation of 8-bits */
		const slice: string = binary.slice(leftCount, (leftCount += 8))
		const byte: number = parseInt(slice, 2)
		bytes[nth] = byte
	}

	return Buffer.from(bytes)
}

/**
 * Mapping semantic version to encoded version number, header 4-bits
 *
 * It's a bit silly to limit the version number to 4-bit, if they keep
 * increasing the version number, the latest possible mapped value is 16
 */
enum Version {
	/**
	 * 2013-02-22
	 * Created this document from original by square specifications
	 */
	"1.0.0" = 0,
	/**
	 * 2015-06-24
	 * Added fields for beneficiary name and address
	 */
	"1.1.0" = 1
}

/**
 * Simple binary header detector
 *
 * The Bysquare header is pretty useless, so the detection isn't as reliable as
 * I'd like
 */
export function detect(qr: string): boolean {
	const inversed: Buffer = inverseAlphanumericConversion(qr)
	if (inversed.byteLength < 2) {
		return false
	}

	const headerBysquare = inversed.slice(0, 2)
	return [...headerBysquare.toString("hex")]
		.map((nibble) => parseInt(nibble, 16))
		.every((nibble, index) => {
			if (index === 1 /** version */) {
				return 0 >= nibble && nibble <= 1
			}

			return 0 <= nibble && nibble <= 15
		})
}

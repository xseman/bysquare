import * as lzma from "lzma-native"

import { Model } from "."
import { SUBST } from "./generate"

enum DecodeSequenceMain {
	InvoiceID,
	Payments,
	PaymentOptions,
	Amount,
	CurrencyCode,
	PaymentDueDate,
	VariableSymbol,
	ConstantSymbol,
	SpecificSymbol,
	OriginatorsReferenceInformation,
	PaymentNote,
	BankAccounts,
	IBAN,
	BIC,
	StandingOrderExt,
	DirectDebitExt,
	BeneficiaryName,
	BeneficiaryAddressLine1,
	BeneficiaryAddressLine2
}

enum DecodeSequenceStandingOrder {
	InvoiceID,
	Payments,
	PaymentOptions,
	Amount,
	CurrencyCode,
	PaymentDueDate,
	VariableSymbol,
	ConstantSymbol,
	SpecificSymbol,
	OriginatorsReferenceInformation,
	PaymentNote,
	BankAccounts,
	IBAN,
	BIC,
	StandingOrderExt,
	Day,
	Month,
	Periodicity,
	LastDate,
	DirectDebitExt,
	BeneficiaryName,
	BeneficiaryAddressLine1,
	BeneficiaryAddressLine2
}

enum DecodeOrderSequenceDirectDebit {
	InvoiceID,
	Payments,
	PaymentOptions,
	Amount,
	CurrencyCode,
	PaymentDueDate,
	VariableSymbol,
	ConstantSymbol,
	SpecificSymbol,
	OriginatorsReferenceInformation,
	PaymentNote,
	BankAccounts,
	IBAN,
	BIC,
	StandingOrderExt,
	DirectDebitExt,
	DirectDebitScheme,
	DirectDebitType,
	VariableSymbol_,
	SpecificSymbol_,
	OriginatorsReferenceInformation_,
	MandateID,
	CreditorID,
	ContractID,
	MaxAmount,
	ValidTillDate,
	BeneficiaryName,
	BeneficiaryAddressLine1,
	BeneficiaryAddressLine2
}

type PickByType<T, Value> = {
	[P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}

type NumericKeys = keyof PickByType<Model, number>

/**
 * Generating by square Code
 *
 * @see {spec 3.14.}
 */
export function createModel(tabbedString: string): Model {
	const splitted = tabbedString
		.split("\t")
		/** The end of the qr-string might contain a NULL-terminated string */
		.map((entry) => entry.replace("\x00", ""))

	/** The model should contain information if it is extended */
	const isStandingOrder = splitted[14] === "1"
	const istDirectDebit = splitted[19] === "1"

	const numericKeys: Array<NumericKeys> = [
		"Payments",
		"PaymentOptions",
		"Amount",
		"BankAccounts",
		"StandingOrderExt",
		"Day",
		"Month",
		"DirectDebitExt",
		"DirectDebitScheme",
		"DirectDebitType",
		"MaxAmount"
	]

	const model = splitted.reduce((acc, value, i) => {
		if (value === "") {
			return acc
		}

		if (!isStandingOrder && !istDirectDebit) {
			const key = DecodeSequenceMain[i] as NumericKeys
			if (numericKeys.includes(key)) {
				acc[key] = Number(value)
				return acc
			}
			acc[key] = value
			return acc
		}

		if (isStandingOrder) {
			const key = DecodeSequenceStandingOrder[i] as NumericKeys
			if (numericKeys.includes(key)) {
				acc[key] = Number(value)
				return acc
			}
			acc[key] = value
			return acc
		}

		if (istDirectDebit) {
			const key = DecodeOrderSequenceDirectDebit[i] as NumericKeys
			if (numericKeys.includes(key)) {
				acc[key] = Number(value)
				return acc
			}
			acc[key] = value
			return acc
		}
	}, {} as any)

	return model
}

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see {spec 3.16.}
 */
export function parse(qr: string): Promise<Model> {
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

	return new Promise<Model>((resolve, reject) => {
		decoder
			.on("error", reject)
			.on("data", (decompress: Buffer): void => {
				const _crc32: Buffer = decompress.slice(0, 4)
				const data = decompress.slice(4).toString()
				const model = createModel(data)

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

enum Version {
	/**
	 * Created this document from original by square specifications
	 */
	'2013-02-22' = 0,
	/**
	 * Added fields for beneficiary name and address
	 */
	'2015-06-24' = 1
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

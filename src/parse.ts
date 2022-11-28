import * as lzma from "lzma-native"
import { base32hex } from "rfc4648"

import {
	CurrencyCodeEnum,
	ParsedModel,
	PaymentOptionsEnum,
	PeriodicityClassifier
} from "./index"

const FIELD_INVOICE = 0
const FIELD_PAYMENT_COUNT = 1
const FIELD_PAYMENT_OPTIONS = 2
const FIELD_BANK_ACCOUNT_COUNT = 11

/**
 * @see 3.14. Generating by square Code
 */
export function assemble(tabbed: string): ParsedModel {
	const fields: string[] = tabbed
		.split("\t")
		/** The end of the qr-string might contain a NULL-terminated string */
		.map((entry) => entry.replace("\x00", ""))

	const invoiceId = fields[FIELD_INVOICE]
	const output: ParsedModel = {
		invoiceId: invoiceId?.length ? invoiceId : undefined,
		payments: []
	}

	const paymentsCount = Number(fields[FIELD_PAYMENT_COUNT])
	const paymentOptions = Number(fields[FIELD_PAYMENT_OPTIONS])
	const bankAccountsCount = Number(fields[FIELD_BANK_ACCOUNT_COUNT])

	for (let i = 0; i < paymentsCount; i++) {
		const paymentFieldCount = 8
		const paymentFieldStart = 3 + (i * paymentFieldCount)
		const paymentFieldEnd = 11 + (i * paymentFieldCount)
		const payment = fields.slice(paymentFieldStart, paymentFieldEnd)
		const [
			ammount,
			currencyCode,
			paymentDueDate,
			variableSymbol,
			constantSymbol,
			specificSymbol,
			originatorsReferenceInformation,
			paymentNote
		] = payment

		output.payments.push({
			amount: ammount.length ? Number(ammount) : 0,
			currencyCode: currencyCode as keyof typeof CurrencyCodeEnum,
			paymentDueDate: paymentDueDate?.length ? paymentDueDate : undefined,
			variableSymbol: variableSymbol?.length ? variableSymbol : undefined,
			constantSymbol: constantSymbol?.length ? constantSymbol : undefined,
			specificSymbol: specificSymbol?.length ? specificSymbol : undefined,
			originatorsReferenceInformation: originatorsReferenceInformation?.length ? originatorsReferenceInformation : undefined,
			paymentNote: paymentNote?.length ? paymentNote : undefined,
			bankAccounts: [],
		})

		for (let j = 0; j < Number(bankAccountsCount); j++) {
			const bankAccountFieldCount = 2
			const bankAccountFieldStart = 12 + (j * bankAccountFieldCount)
			const bankAccountFieldEnd = 14 + (j * bankAccountFieldCount)
			const bankAccounts = fields.slice(bankAccountFieldStart, bankAccountFieldEnd)
			const [
				iban,
				bic
			] = bankAccounts

			if (iban?.length === 0) {
				throw new Error("Missing IBAN")
			}

			output.payments[i].bankAccounts.push({
				iban: iban,
				bic: bic?.length ? bic : undefined
			})
		}

		switch (paymentOptions) {
			case PaymentOptionsEnum.PaymentOrder:
				break

			case PaymentOptionsEnum.StandingOrder:
				const standingOrderFieldCount = 4
				const standingOrderFieldStart = 15 + (i * standingOrderFieldCount)
				const standingOrderFieldEnd = 20 + (i * standingOrderFieldCount)
				const standingOrder = fields.slice(standingOrderFieldStart, standingOrderFieldEnd)
				const [
					day,
					month,
					periodicity,
					lastDate
				] = standingOrder

				output.payments[i].standingOrder = {
					day: day?.length ? Number(day) : undefined,
					month: month?.length ? Number(month) : undefined,
					periodicity: periodicity?.length ? periodicity as PeriodicityClassifier : undefined,
					lastDate: lastDate?.length ? lastDate : undefined
				}
				break

			case PaymentOptionsEnum.DirectDebit:
				const directDebitFieldCount = 10
				const directDebitFieldStart = 16 + (i * directDebitFieldCount)
				const directDebitFieldEnd = 27 + (i * directDebitFieldStart)
				const directDebit = fields.slice(directDebitFieldStart, directDebitFieldEnd)
				const [
					directDebitScheme,
					directDebitType,
					variableSymbol,
					specificSymbol,
					originatorsReferenceInformation,
					mandateId,
					creditorId,
					contractId,
					maxAmount,
					validTillDate,
				] = directDebit

				output.payments[i].directDebit = {
					directDebitScheme: directDebitScheme.length ? Number(directDebitScheme) : undefined,
					directDebitType: directDebitType.length ? Number(directDebitType) : undefined,
					variableSymbol: variableSymbol.length ? variableSymbol : undefined,
					specificSymbol: specificSymbol.length ? specificSymbol : undefined,
					originatorsReferenceInformation: originatorsReferenceInformation.length ? originatorsReferenceInformation : undefined,
					mandateId: mandateId.length ? mandateId : undefined,
					creditorId: creditorId.length ? creditorId : undefined,
					contractId: contractId.length ? contractId : undefined,
					maxAmount: maxAmount.length ? Number(maxAmount) : undefined,
					validTillDate: validTillDate.length ? validTillDate : undefined
				}

			default:
				throw new Error("Unknown payment option")
		}
	}

	/** Beneficiary list bysquare v1.1 */
	for (let i = 0; i < paymentsCount; i++) {
		let beneficiary: string[] = []
		const offset = (i || 1) * (2 * bankAccountsCount) - 2

		switch (paymentOptions) {
			case PaymentOptionsEnum.PaymentOrder:
				beneficiary = fields.slice(16 + offset, 20 + offset)
				break

			case PaymentOptionsEnum.StandingOrder:
				beneficiary = fields.slice(20 + offset, 24 + offset)
				break

			case PaymentOptionsEnum.DirectDebit:
				beneficiary = fields.slice(25 + offset, 29 + offset)
				break
		}

		if (beneficiary.length === 0) {
			break
		}

		const [
			name,
			addressLine1,
			addressLine2
		] = beneficiary

		/**
		 * The list of recipients is optional, if we find a missing record, the
		 * stream ends
		 */
		if (!name && !addressLine1 && !addressLine2) {
			break
		}

		output.payments[i].beneficiary = {
			name: name?.length ? name : undefined,
			addressLine1: addressLine1?.length ? addressLine1 : undefined,
			addressLine2: addressLine2?.length ? addressLine2 : undefined
		}
	}

	return output
}

/**
 * @see 3.16. Decoding client data from QR Code 2005 symbol
 */
export function parse(qr: string): Promise<ParsedModel> {
	const inversed = base32hex.parse(qr, {
		out: Buffer,
		loose: true
	}) as Buffer

	const _headerBysquare = inversed.subarray(0, 2)
	const _headerCompression = inversed.subarray(2, 4)
	const compressedData = inversed.subarray(4)

	// @ts-ignore: Missing decored types
	const decoder = lzma.createStream("rawDecoder", {
		synchronous: true,
		// @ts-ignore: Missing filter types
		filters: [{ id: lzma.FILTER_LZMA1 }]
	})

	return new Promise<ParsedModel>((resolve, reject) => {
		decoder
			.on("data", (decompress: Buffer): void => {
				const _crc32: Buffer = decompress.subarray(0, 4)
				const tabbed: string = decompress.subarray(4).toString()
				resolve(assemble(tabbed))
			})
			.on("error", reject)
			.write(compressedData, (error): void => {
				error && reject(error)
				decoder.end()
			})
	})
}

/**
 * Simple binary header detector
 *
 * The Bysquare header is pretty useless, so the detection isn't as reliable as
 * I'd like
 */
export function detect(qr: string): boolean {
	const parsed = base32hex.parse(qr, {
		out: Buffer,
		loose: true
	}) as Buffer

	if (parsed.byteLength < 2) {
		return false
	}

	const headerBysquare = parsed.slice(0, 2)
	return [...headerBysquare.toString("hex")]
		.map((nibble) => parseInt(nibble, 16))
		.every((nibble, index) => {
			if (/** version */ index === 1) {
				return 0 >= nibble && nibble <= 1
			}

			return 0 <= nibble && nibble <= 15
		})
}

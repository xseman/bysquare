import deburr from "lodash.deburr"
import lzma from "lzma-native"
import { base32hex } from "rfc4648"

import { DataModel, PaymentOptions } from "./types.js"

// echo "Hello" | xz --format=raw --lzma1=lc=3,lp=0,pb=2,dict=32KiB --stdout | hexdump -C

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
 * @see 3.5. by square header
 */
export function bysquareHeader(
	header: [
		bySquareType: number, version: number,
		documentType: number, reserved: number
	] = [
			0b0000_0000, 0b0000_0000,
			0b0000_0000, 0b0000_0000
		]
): Buffer {
	const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15)
	if (!isValid) {
		throw new Error(`Invalid header byte value, valid range <0,15>`)
	}

	const [
		bySquareType, version,
		documentType, reserved
	] = header

	// Combine 4-nibbles to 2-bytes
	const mergedNibbles = Buffer.from([
		(bySquareType << 4) | (version << 0),
		(documentType << 4) | (reserved << 0),
	])

	return mergedNibbles
}

/**
 * Allocates a new buffer of a 2 bytes that represents LZMA header which
 * contains 16-bit unsigned integer (word, little-endian), which is the size of
 * the decompressed data. Therefore the maximum size of compressed data is
 * limited to 65535
 *
 * @see 3.11. LZMA Compression
 */
function lzmaHeader(decompressedData: Buffer): Buffer {
	const bytesCount = decompressedData.length
	if (bytesCount >= 2 ** 16) {
		throw new Error("The maximum compressed data size has been reached")
	}

	const dataSize = Buffer.alloc(2)
	dataSize.writeInt16LE(bytesCount)
	return dataSize
}

/**
 * @see 3.10 Appending CRC32 checksum
 */
export function checksum(intermediate: string): Buffer {
	// @ts-ignore: Wrong return type
	const data = lzma.crc32(intermediate) as number
	const crc32 = Buffer.alloc(4)
	crc32.writeUInt32LE(data)

	return crc32
}

/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10. Appending CRC32 checksum
 */
export function prepareCompression(model: DataModel): Buffer {
	const intermediate = toIntermediate(model)
	return Buffer.concat([
		checksum(intermediate),
		Buffer.from(intermediate, "utf-8")
	])
}

/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15 PAY by square sequence data model
 */
export function toIntermediate(data: DataModel): string {
	const intermediate = new Array<string | undefined>()

	intermediate.push(data.invoiceId?.toString())
	intermediate.push(data.payments.length.toString())

	for (const p of data.payments) {
		intermediate.push(p.type.toString())
		intermediate.push(p.amount?.toString())
		intermediate.push(p.currencyCode)
		intermediate.push(p.paymentDueDate)
		intermediate.push(p.variableSymbol)
		intermediate.push(p.constantSymbol)
		intermediate.push(p.specificSymbol)
		intermediate.push(p.originatorRefInfo)
		intermediate.push(p.paymentNote)

		intermediate.push(p.bankAccounts.length.toString())
		for (const ba of p.bankAccounts) {
			intermediate.push(ba.iban)
			intermediate.push(ba.bic)
		}

		if (p.type === PaymentOptions.StandingOrder) {
			intermediate.push('1')
			intermediate.push(p.day?.toString())
			intermediate.push(p.month?.toString())
			intermediate.push(p.periodicity)
			intermediate.push(p.lastDate)
		} else {
			intermediate.push('0')
		}

		if (p.type === PaymentOptions.DirectDebit) {
			intermediate.push('1')
			intermediate.push(p.directDebitScheme?.toString())
			intermediate.push(p.directDebitType?.toString())
			intermediate.push(p.variableSymbol?.toString())
			intermediate.push(p.specificSymbol?.toString())
			intermediate.push(p.originatorRefInfo?.toString())
			intermediate.push(p.mandateId?.toString())
			intermediate.push(p.creditorId?.toString())
			intermediate.push(p.contractId?.toString())
			intermediate.push(p.maxAmount?.toString())
			intermediate.push(p.validTillDate?.toString())
		} else {
			intermediate.push('0')
		}
	}

	for (const p of data.payments) {
		intermediate.push(p.beneficiary?.name)
		intermediate.push(p.beneficiary?.street)
		intermediate.push(p.beneficiary?.city)
	}

	return intermediate.join('\t')
}

/**
 * Transfer diacritics to basic latin letters
 */
function removeDiacritics(model: DataModel): void {
	for (const payment of model.payments) {
		if (payment.paymentNote) {
			payment.paymentNote = deburr(payment.paymentNote)
		}

		if (payment.beneficiary?.name) {
			payment.beneficiary.name = deburr(payment.beneficiary.name)
		}

		if (payment.beneficiary?.city) {
			payment.beneficiary.city = deburr(payment.beneficiary.city)
		}

		if (payment.beneficiary?.street) {
			payment.beneficiary.street = deburr(payment.beneficiary.street)
		}
	}
}

type Options = {
	deburr: boolean
}

/**
 * Generate QR string ready for encoding into text QR code
 */
export function generate(
	model: DataModel,
	options: Options = { deburr: true }
): Promise<string> {
	if (options.deburr) {
		removeDiacritics(model)
	}

	const data: Buffer = prepareCompression(model)
	const compressedData: Buffer[] = []

	return new Promise<string>((resolve, reject) => {
		const encoder = lzma.createStream("rawEncoder", {
			synchronous: true,
			// @ts-ignore: Missing filter types
			filters: [
				{
					// @ts-ignore: Missing filter types
					id: lzma.FILTER_LZMA1,
					lc: 3,
					lp: 0,
					pb: 2,
					dict_size: 2 ** 17, // 128 kilobytes
				},
			],
		})

		encoder
			.on("end", (): void => {
				const output = Buffer.concat([
					bysquareHeader(),
					lzmaHeader(data),
					...compressedData
				])
				resolve(base32hex.stringify(output, { pad: false }))
			})
			.on("data", (chunk: Buffer): void => {
				compressedData.push(chunk)
			})
			.on("error", reject)
			.write(data, (error): void => {
				error && reject(error)
				encoder.end()
			})
	})
}

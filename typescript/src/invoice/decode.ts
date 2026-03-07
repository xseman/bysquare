import { decompress } from "lzma1";

import * as base32hex from "../base32hex.js";
import { crc32 } from "../crc32.js";
import {
	DecodeError,
	DecodeErrorMessage,
	decodeHeader,
} from "../header.js";
import { Version } from "../types.js";
import type {
	Contact,
	CustomerParty,
	DataModel,
	InvoiceDocumentType,
	MonetarySummary,
	PostalAddress,
	SingleInvoiceLine,
	SupplierParty,
	TaxCategorySummary,
} from "./types.js";

function decodeNumber(value: string | undefined): number | undefined {
	return value?.length ? Number(value) : undefined;
}

function decodeString(value: string | undefined): string | undefined {
	return value?.length ? value : undefined;
}

/**
 * Parse a tab-separated intermediate format into DataModel.
 *
 * Field order follows the specification (40 + N×5 fields).
 */
export function deserialize(
	tabString: string,
	documentType: InvoiceDocumentType,
): DataModel {
	const data = tabString.split("\t");
	let i = 0;

	function next(): string | undefined {
		return data[i++];
	}

	// Core fields (9)
	const invoiceId = next() ?? "";
	const issueDate = next() ?? "";
	const taxPointDate = decodeString(next());
	const orderId = decodeString(next());
	const deliveryNoteId = decodeString(next());
	const localCurrencyCode = next() ?? "";
	const foreignCurrencyCode = decodeString(next());
	const currRate = decodeNumber(next());
	const referenceCurrRate = decodeNumber(next());

	// Supplier party (13 fields)
	const supplierPartyName = next() ?? "";
	const supplierCompanyTaxId = decodeString(next());
	const supplierCompanyVatId = decodeString(next());
	const supplierCompanyRegisterId = decodeString(next());

	const postalAddress: PostalAddress = {
		streetName: decodeString(next()),
		buildingNumber: decodeString(next()),
		cityName: decodeString(next()),
		postalZone: decodeString(next()),
		state: decodeString(next()),
		country: decodeString(next()),
	};

	const contactName = decodeString(next());
	const contactTelephone = decodeString(next());
	const contactEmail = decodeString(next());
	const contact: Contact | undefined = (contactName || contactTelephone || contactEmail)
		? {
			name: contactName,
			telephone: contactTelephone,
			email: contactEmail,
		}
		: undefined;

	const supplierParty: SupplierParty = {
		partyName: supplierPartyName,
		companyTaxId: supplierCompanyTaxId,
		companyVatId: supplierCompanyVatId,
		companyRegisterId: supplierCompanyRegisterId,
		postalAddress,
		contact,
	};

	// Customer party (5 fields)
	const customerPartyName = next() ?? "";
	const customerCompanyTaxId = decodeString(next());
	const customerCompanyVatId = decodeString(next());
	const customerCompanyRegisterId = decodeString(next());
	const partyIdentification = decodeString(next());

	const customerParty: CustomerParty = {
		partyName: customerPartyName,
		companyTaxId: customerCompanyTaxId,
		companyVatId: customerCompanyVatId,
		companyRegisterId: customerCompanyRegisterId,
		partyIdentification,
	};

	// Invoice detail
	const numberOfInvoiceLines = decodeNumber(next());
	const invoiceDescription = decodeString(next());

	// Single invoice line (7 fields)
	const lineOrderId = decodeString(next());
	const lineDeliveryNoteId = decodeString(next());
	const lineItemName = decodeString(next());
	const lineItemEanCode = decodeString(next());
	const linePeriodFrom = decodeString(next());
	const linePeriodTo = decodeString(next());
	const lineQuantity = decodeNumber(next());

	const hasSingleLine = lineOrderId !== undefined
		|| lineDeliveryNoteId !== undefined
		|| lineItemName !== undefined
		|| lineItemEanCode !== undefined
		|| linePeriodFrom !== undefined
		|| linePeriodTo !== undefined
		|| lineQuantity !== undefined;

	const singleInvoiceLine: SingleInvoiceLine | undefined = hasSingleLine
		? {
			orderLineId: lineOrderId,
			deliveryNoteLineId: lineDeliveryNoteId,
			itemName: lineItemName,
			itemEanCode: lineItemEanCode,
			periodFromDate: linePeriodFrom,
			periodToDate: linePeriodTo,
			invoicedQuantity: lineQuantity,
		}
		: undefined;

	// Tax category summaries
	const taxCount = Number(next() ?? "0");
	const taxCategorySummaries: TaxCategorySummary[] = [];

	for (let t = 0; t < taxCount; t++) {
		taxCategorySummaries.push({
			classifiedTaxCategory: Number(next() ?? "0"),
			taxExclusiveAmount: Number(next() ?? "0"),
			taxAmount: Number(next() ?? "0"),
			alreadyClaimedTaxExclusiveAmount: decodeNumber(next()),
			alreadyClaimedTaxAmount: decodeNumber(next()),
		});
	}

	// Monetary summary (2 fields)
	const monetarySummary: MonetarySummary = {
		payableRoundingAmount: decodeNumber(next()),
		paidDepositsAmount: decodeNumber(next()),
	};

	// Payment means bitmask
	const paymentMeans = decodeNumber(next());

	return {
		documentType,
		invoiceId,
		issueDate,
		taxPointDate,
		orderId,
		deliveryNoteId,
		localCurrencyCode,
		foreignCurrencyCode,
		currRate,
		referenceCurrRate,
		supplierParty,
		customerParty,
		numberOfInvoiceLines,
		invoiceDescription,
		singleInvoiceLine,
		taxCategorySummaries,
		monetarySummary,
		paymentMeans,
	};
}

/**
 * Decode QR string into DataModel.
 *
 * Expects bysquareType=1 in the header. The documentType nibble determines the
 * specific invoice subtype (Invoice, ProformaInvoice, CreditNote, DebitNote,
 * AdvanceInvoice).
 *
 * @see 3.16.
 * @param qr base32hex encoded bysquare binary data
 */
export function decode(qr: string): DataModel {
	const bytes = base32hex.decode(qr);
	const headerBytes = bytes.slice(0, 2);
	const headerData = decodeHeader(headerBytes);

	if (headerData.bysquareType !== 0x01) {
		throw new DecodeError("Expected bysquareType 1 (Invoice), got " + headerData.bysquareType, {
			bysquareType: headerData.bysquareType,
		});
	}

	if (headerData.version > Version["1.2.0"]) {
		throw new DecodeError(DecodeErrorMessage.UnsupportedVersion, {
			version: headerData.version,
		});
	}

	// Reconstruct LZMA header for decompression
	const defaultProperties = [0x5D]; // lc=3, lp=0, pb=2
	const defaultDictionarySize = [0x00, 0x00, 0x02, 0x00]; // 2^17 = 131072

	const payloadLengthBytes = bytes.slice(2, 4);
	const payloadLength = payloadLengthBytes[0] | (payloadLengthBytes[1] << 8);

	const uncompressedSize = new Uint8Array(8);
	uncompressedSize[0] = payloadLength & 0xFF;
	uncompressedSize[1] = (payloadLength >> 8) & 0xFF;
	uncompressedSize[2] = (payloadLength >> 16) & 0xFF;
	uncompressedSize[3] = (payloadLength >> 24) & 0xFF;

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

	return deserialize(decoded, headerData.documentType as InvoiceDocumentType);
}

import * as base32hex from "../base32hex.js";
import {
	formatDecimal,
	sanitize,
} from "../field.js";
import {
	addChecksum,
	buildBysquareHeader,
	buildPayloadLength,
} from "../header.js";
import * as lzma from "../lzma.js";
import { Version } from "../types.js";
import type { DataModel } from "./types.js";
import { validateDataModel } from "./validations.js";

/**
 * Transform DataModel to a tab-separated intermediate format.
 *
 * Field order follows the specification (40 + N×5 fields):
 *
 * - Field 0: invoiceId
 * - Field 1: issueDate (YYYYMMDD)
 * - Field 2: taxPointDate (YYYYMMDD)
 * - Field 3: orderId
 * - Field 4: deliveryNoteId
 * - Field 5: localCurrencyCode
 * - Field 6: foreignCurrencyCode
 * - Field 7: currRate
 * - Field 8: referenceCurrRate
 *
 * Supplier party (13 fields):
 * - Fields 9-12: partyName, companyTaxId, companyVatId, companyRegisterId
 * - Fields 13-18: postalAddress (streetName, buildingNumber, cityName, postalZone, state, country)
 * - Fields 19-21: contact (name, telephone, email)
 *
 * Customer party (5 fields):
 * - Fields 22-25: partyName, companyTaxId, companyVatId, companyRegisterId
 * - Field 26: partyIdentification
 *
 * - Field 27: numberOfInvoiceLines
 * - Field 28: invoiceDescription
 *
 * Single invoice line (7 fields):
 * - Fields 29-35: orderLineId, deliveryNoteLineId, itemName, itemEanCode,
 *                 periodFromDate, periodToDate, invoicedQuantity
 *
 * Tax category summaries:
 * - Field 36: count
 * - Fields 37..36+N×5: per summary (classifiedTaxCategory, taxExclusiveAmount,
 *                      taxAmount, alreadyClaimedTaxExclusiveAmount, alreadyClaimedTaxAmount)
 *
 * Monetary summary (2 fields):
 * - payableRoundingAmount, paidDepositsAmount
 *
 * - Last field: paymentMeans (bitmask)
 */
export function serialize(data: DataModel): string {
	const s = new Array<string | undefined>();

	// Core fields
	s.push(sanitize(data.invoiceId));
	s.push(sanitize(data.issueDate));
	s.push(sanitize(data.taxPointDate));
	s.push(sanitize(data.orderId));
	s.push(sanitize(data.deliveryNoteId));
	s.push(sanitize(data.localCurrencyCode));
	s.push(sanitize(data.foreignCurrencyCode));
	s.push(formatDecimal(data.currRate));
	s.push(formatDecimal(data.referenceCurrRate));

	// Supplier party (13 fields)
	const sp = data.supplierParty;
	s.push(sanitize(sp.partyName));
	s.push(sanitize(sp.companyTaxId));
	s.push(sanitize(sp.companyVatId));
	s.push(sanitize(sp.companyRegisterId));

	const pa = sp.postalAddress;
	s.push(sanitize(pa.streetName));
	s.push(sanitize(pa.buildingNumber));
	s.push(sanitize(pa.cityName));
	s.push(sanitize(pa.postalZone));
	s.push(sanitize(pa.state));
	s.push(sanitize(pa.country));

	const contact = sp.contact;
	s.push(sanitize(contact?.name));
	s.push(sanitize(contact?.telephone));
	s.push(sanitize(contact?.email));

	// Customer party (5 fields)
	const cp = data.customerParty;
	s.push(sanitize(cp.partyName));
	s.push(sanitize(cp.companyTaxId));
	s.push(sanitize(cp.companyVatId));
	s.push(sanitize(cp.companyRegisterId));
	s.push(sanitize(cp.partyIdentification));

	// Invoice detail
	s.push(data.numberOfInvoiceLines?.toString());
	s.push(sanitize(data.invoiceDescription));

	// Single invoice line (7 fields)
	const line = data.singleInvoiceLine;
	s.push(sanitize(line?.orderLineId));
	s.push(sanitize(line?.deliveryNoteLineId));
	s.push(sanitize(line?.itemName));
	s.push(sanitize(line?.itemEanCode));
	s.push(sanitize(line?.periodFromDate));
	s.push(sanitize(line?.periodToDate));
	s.push(formatDecimal(line?.invoicedQuantity));

	// Tax category summaries
	s.push(data.taxCategorySummaries.length.toString());
	for (const tcs of data.taxCategorySummaries) {
		s.push(formatDecimal(tcs.classifiedTaxCategory));
		s.push(formatDecimal(tcs.taxExclusiveAmount));
		s.push(formatDecimal(tcs.taxAmount));
		s.push(formatDecimal(tcs.alreadyClaimedTaxExclusiveAmount));
		s.push(formatDecimal(tcs.alreadyClaimedTaxAmount));
	}

	// Monetary summary (2 fields)
	s.push(formatDecimal(data.monetarySummary.payableRoundingAmount));
	s.push(formatDecimal(data.monetarySummary.paidDepositsAmount));

	// Payment means bitmask
	s.push(data.paymentMeans?.toString());

	return s.join("\t");
}

export type EncodeOptions = {
	/**
	 * Validate the data model before encoding.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Version of the BySquare format to use.
	 *
	 * The official app only recognizes headers with version=0 and performs
	 * strict equality matching, so version 1.0.0 is the only compatible
	 * value.
	 *
	 * @default Version["1.0.0"]
	 */
	version?: Version;
};

/**
 * Encode an invoice data model into a QR string.
 *
 * Uses bysquareType=1 and the documentType from DataModel to build
 * the header. The binary pipeline is shared with PAY by square:
 * serialize → CRC32 → LZMA → header + length → base32hex.
 *
 * @see 3.16.
 */
export function encode(
	model: DataModel,
	options: EncodeOptions = { validate: true },
): string {
	const version = options.version ?? Version["1.0.0"];

	if (options.validate) {
		validateDataModel(model);
	}

	const payloadTabbed = serialize(model);
	const payloadChecked = addChecksum(payloadTabbed);
	const lzmaBody = lzma.compress(payloadChecked);

	const bysquareType = 0x01; // TYPE_INVOICE
	const output = new Uint8Array([
		...buildBysquareHeader([bysquareType, version, model.documentType, 0x00]),
		...buildPayloadLength(payloadChecked.byteLength),
		...lzmaBody,
	]);

	return base32hex.encode(output, false);
}

import crc32 from "crc-32";
import deburr from "lodash.deburr";
import * as lzma from "lzma1";
import { base32hex } from "rfc4648";
import { PaymentOptions } from "./types.js";
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
export function headerBysquare(
/** dprint-ignore */
header = [
    0x00, 0x00,
    0x00, 0x00
]) {
    const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15);
    if (!isValid) {
        throw new Error("Invalid header byte value, valid range <0,15>");
    }
    const [bySquareType, version, documentType, reserved] = header;
    // Combine 4-nibbles to 2-bytes
    const mergedNibbles = Uint8Array.from([
        (bySquareType << 4) | (version << 0),
        (documentType << 4) | (reserved << 0)
    ]);
    return mergedNibbles;
}
/**
 * The function first sets default values for the lc, lp, and pb properties,
 * which represent the number of literal context bits, literal position bits,
 * and position bits, respectively. These values are then used to calculate the
 * properties value, which is a single byte that encodes all three properties.
 *
 * @see 3.11.
 */
function headerLzmaProps() {
    const lc = 3;
    const lp = 0;
    const pb = 2;
    const properties = (((pb * 5) + lp) * 9) + lc;
    const header = new ArrayBuffer(1);
    new DataView(header).setUint8(0, properties);
    return new Uint8Array(header);
}
/**
 * Creates a one-byte array that represents the length of compressed data in
 * combination with CRC32 in bytes.
 */
export function headerDataLength(length) {
    if (length >= 2 ** 16) {
        throw new Error("The maximum compressed data size has been reached");
    }
    const header = new ArrayBuffer(1);
    new DataView(header).setUint8(0, length);
    return new Uint8Array(header);
}
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10.
 */
export function addChecksum(serialized) {
    const checksum = new ArrayBuffer(4);
    new DataView(checksum).setUint32(0, crc32.str(serialized), true);
    const byteArray = new TextEncoder().encode(serialized);
    return Uint8Array.from([
        ...new Uint8Array(checksum),
        ...Uint8Array.from(byteArray)
    ]);
}
/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15.
 */
export function serialize(data) {
    const serialized = new Array();
    serialized.push(data.invoiceId?.toString());
    serialized.push(data.payments.length.toString());
    for (const p of data.payments) {
        serialized.push(p.type.toString());
        serialized.push(p.amount?.toString());
        serialized.push(p.currencyCode);
        serialized.push(p.paymentDueDate);
        serialized.push(p.variableSymbol);
        serialized.push(p.constantSymbol);
        serialized.push(p.specificSymbol);
        serialized.push(p.originatorRefInfo);
        serialized.push(p.paymentNote);
        serialized.push(p.bankAccounts.length.toString());
        for (const ba of p.bankAccounts) {
            serialized.push(ba.iban);
            serialized.push(ba.bic);
        }
        if (p.type === PaymentOptions.StandingOrder) {
            serialized.push("1");
            serialized.push(p.day?.toString());
            serialized.push(p.month?.toString());
            serialized.push(p.periodicity);
            serialized.push(p.lastDate);
        }
        else {
            serialized.push("0");
        }
        if (p.type === PaymentOptions.DirectDebit) {
            serialized.push("1");
            serialized.push(p.directDebitScheme?.toString());
            serialized.push(p.directDebitType?.toString());
            serialized.push(p.variableSymbol?.toString());
            serialized.push(p.specificSymbol?.toString());
            serialized.push(p.originatorRefInfo?.toString());
            serialized.push(p.mandateId?.toString());
            serialized.push(p.creditorId?.toString());
            serialized.push(p.contractId?.toString());
            serialized.push(p.maxAmount?.toString());
            serialized.push(p.validTillDate?.toString());
        }
        else {
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
function removeDiacritics(model) {
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
/**
 * Generate QR string ready for encoding into text QR code
 */
export function generate(model, options = { deburr: true }) {
    if (options.deburr) {
        removeDiacritics(model);
    }
    const payload = serialize(model);
    const withChecksum = addChecksum(payload);
    const compressed = Uint8Array.from(lzma.compress(withChecksum));
    /** Exclude the LZMA header and retain raw compressed data */
    const _headerLzma = Uint8Array.from(compressed.subarray(0, 13));
    const compressedPayload = Uint8Array.from(compressed.subarray(13));
    const output = Uint8Array.from([
        ...headerBysquare([0x00, 1 /* Version["1.1.0"] */, 0x00, 0x00]),
        ...headerLzmaProps(),
        ...headerDataLength(withChecksum.byteLength),
        ...compressedPayload
    ]);
    return base32hex.stringify(output, {
        pad: false
    });
}

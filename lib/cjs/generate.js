"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.deserialize = exports.addChecksum = exports.checksum = exports.bysquareHeader = void 0;
const crc_32_1 = __importDefault(require("crc-32"));
const lodash_deburr_1 = __importDefault(require("lodash.deburr"));
const rfc4648_1 = require("rfc4648");
const types_js_1 = require("./types.js");
// @ts-ignore: missing types
const lzma_1 = __importDefault(require("lzma"));
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
function bysquareHeader(header = [
    0, 0,
    0, 0
]) {
    const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15);
    if (!isValid) {
        throw new Error(`Invalid header byte value, valid range <0,15>`);
    }
    const [bySquareType, version, documentType, reserved] = header;
    // Combine 4-nibbles to 2-bytes
    const mergedNibbles = Uint8Array.from([
        (bySquareType << 4) | (version << 0),
        (documentType << 4) | (reserved << 0),
    ]);
    return mergedNibbles;
}
exports.bysquareHeader = bysquareHeader;
/**
 * Allocates a new buffer of a 2 bytes that represents LZMA header which
 * contains 16-bit unsigned integer (word, little-endian), which is the size of
 * the decompressed data. Therefore the maximum size of compressed data is
 * limited to 65535
 *
 * @see 3.11. LZMA Compression
 */
function datasizeHeader(data) {
    if (data.byteLength >= 2 ** 16) {
        throw new Error("The maximum compressed data size has been reached");
    }
    const header = new Uint8Array(2);
    header.set(Uint16Array.from([data.byteLength]));
    return header;
}
/**
 * @see 3.10 Appending CRC32 checksum
 */
function checksum(intermediate) {
    const data = crc_32_1.default.str(intermediate);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32LE(data);
    return checksum;
}
exports.checksum = checksum;
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10. Appending CRC32 checksum
 */
function addChecksum(model) {
    const intermediate = deserialize(model);
    const checksum = Uint32Array.from([crc_32_1.default.str(intermediate)]);
    const byearray = [...intermediate].map(char => char.charCodeAt(0));
    return Uint8Array.from([
        ...new Uint8Array(checksum.buffer),
        ...Uint8Array.from(byearray)
    ]);
}
exports.addChecksum = addChecksum;
/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15 PAY by square sequence data model
 */
function deserialize(data) {
    const intermediate = new Array();
    intermediate.push(data.invoiceId?.toString());
    intermediate.push(data.payments.length.toString());
    for (const p of data.payments) {
        intermediate.push(p.type.toString());
        intermediate.push(p.amount?.toString());
        intermediate.push(p.currencyCode);
        intermediate.push(p.paymentDueDate);
        intermediate.push(p.variableSymbol);
        intermediate.push(p.constantSymbol);
        intermediate.push(p.specificSymbol);
        intermediate.push(p.originatorRefInfo);
        intermediate.push(p.paymentNote);
        intermediate.push(p.bankAccounts.length.toString());
        for (const ba of p.bankAccounts) {
            intermediate.push(ba.iban);
            intermediate.push(ba.bic);
        }
        if (p.type === types_js_1.PaymentOptions.StandingOrder) {
            intermediate.push('1');
            intermediate.push(p.day?.toString());
            intermediate.push(p.month?.toString());
            intermediate.push(p.periodicity);
            intermediate.push(p.lastDate);
        }
        else {
            intermediate.push('0');
        }
        if (p.type === types_js_1.PaymentOptions.DirectDebit) {
            intermediate.push('1');
            intermediate.push(p.directDebitScheme?.toString());
            intermediate.push(p.directDebitType?.toString());
            intermediate.push(p.variableSymbol?.toString());
            intermediate.push(p.specificSymbol?.toString());
            intermediate.push(p.originatorRefInfo?.toString());
            intermediate.push(p.mandateId?.toString());
            intermediate.push(p.creditorId?.toString());
            intermediate.push(p.contractId?.toString());
            intermediate.push(p.maxAmount?.toString());
            intermediate.push(p.validTillDate?.toString());
        }
        else {
            intermediate.push('0');
        }
    }
    for (const p of data.payments) {
        intermediate.push(p.beneficiary?.name);
        intermediate.push(p.beneficiary?.street);
        intermediate.push(p.beneficiary?.city);
    }
    return intermediate.join('\t');
}
exports.deserialize = deserialize;
function removeDiacritics(model) {
    for (const payment of model.payments) {
        if (payment.paymentNote) {
            payment.paymentNote = (0, lodash_deburr_1.default)(payment.paymentNote);
        }
        if (payment.beneficiary?.name) {
            payment.beneficiary.name = (0, lodash_deburr_1.default)(payment.beneficiary.name);
        }
        if (payment.beneficiary?.city) {
            payment.beneficiary.city = (0, lodash_deburr_1.default)(payment.beneficiary.city);
        }
        if (payment.beneficiary?.street) {
            payment.beneficiary.street = (0, lodash_deburr_1.default)(payment.beneficiary.street);
        }
    }
}
/**
 * Generate QR string ready for encoding into text QR code
 */
function generate(model, options = { deburr: true }) {
    if (options.deburr) {
        removeDiacritics(model);
    }
    const payload = addChecksum(model);
    const compressed = Uint8Array.from(lzma_1.default.compress(payload));
    /**
     * @see https://docs.fileformat.com/compression/lzma/#lzma-header
     */
    const _header = Uint8Array.from(compressed.subarray(0, 13));
    const data = Uint8Array.from(compressed.subarray(13));
    const output = Uint8Array.from([
        ...bysquareHeader(),
        ...datasizeHeader(payload),
        ...data
    ]);
    return rfc4648_1.base32hex.stringify(output, {
        pad: false
    });
}
exports.generate = generate;

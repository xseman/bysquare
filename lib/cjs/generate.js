"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.serialize = exports.addChecksum = exports.headerDataLength = exports.headerBysquare = void 0;
const crc_32_1 = __importDefault(require("crc-32"));
const lodash_deburr_1 = __importDefault(require("lodash.deburr"));
const lzma = __importStar(require("lzma1"));
const rfc4648_1 = require("rfc4648");
const types_js_1 = require("./types.js");
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
function headerBysquare(
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
exports.headerBysquare = headerBysquare;
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
function headerDataLength(length) {
    if (length >= 2 ** 16) {
        throw new Error("The maximum compressed data size has been reached");
    }
    const header = new ArrayBuffer(1);
    new DataView(header).setUint8(0, length);
    return new Uint8Array(header);
}
exports.headerDataLength = headerDataLength;
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10.
 */
function addChecksum(serialized) {
    const checksum = new ArrayBuffer(4);
    new DataView(checksum).setUint32(0, crc_32_1.default.str(serialized), true);
    const byteArray = new TextEncoder().encode(serialized);
    return Uint8Array.from([
        ...new Uint8Array(checksum),
        ...Uint8Array.from(byteArray)
    ]);
}
exports.addChecksum = addChecksum;
/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15.
 */
function serialize(data) {
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
        if (p.type === types_js_1.PaymentOptions.StandingOrder) {
            serialized.push("1");
            serialized.push(p.day?.toString());
            serialized.push(p.month?.toString());
            serialized.push(p.periodicity);
            serialized.push(p.lastDate);
        }
        else {
            serialized.push("0");
        }
        if (p.type === types_js_1.PaymentOptions.DirectDebit) {
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
exports.serialize = serialize;
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
    return rfc4648_1.base32hex.stringify(output, {
        pad: false
    });
}
exports.generate = generate;

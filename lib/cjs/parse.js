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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detect = exports.parse = exports.DecodeError = exports.deserialize = void 0;
const lzma = __importStar(require("lzma1"));
const rfc4648_1 = require("rfc4648");
const index_js_1 = require("./index.js");
function cleanEmptyProps(obj) {
    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "undefined") {
            delete obj[key];
        }
    });
}
/**
 * Generating by square Code
 *
 * @see 3.14.
 */
function deserialize(qr) {
    const serialized = qr.split("\t");
    const invoiceId = serialized.shift();
    const output = {
        invoiceId: invoiceId?.length ? invoiceId : undefined,
        payments: []
    };
    const paymentslen = Number(serialized.shift());
    for (let i = 0; i < paymentslen; i++) {
        const paymentOptions = serialized.shift();
        const ammount = serialized.shift();
        const currency = serialized.shift();
        const dueDate = serialized.shift();
        const variables = serialized.shift();
        const constants = serialized.shift();
        const specifics = serialized.shift();
        const originatorRefInfo = serialized.shift();
        const paymentNote = serialized.shift();
        let payment = {
            bankAccounts: [],
            type: Number(paymentOptions),
            currencyCode: currency,
            amount: ammount?.length
                ? Number(ammount)
                : undefined,
            paymentDueDate: dueDate?.length
                ? dueDate
                : undefined,
            variableSymbol: variables?.length
                ? variables
                : undefined,
            constantSymbol: constants?.length
                ? constants
                : undefined,
            specificSymbol: specifics?.length
                ? specifics
                : undefined,
            originatorRefInfo: originatorRefInfo?.length
                ? originatorRefInfo
                : undefined,
            paymentNote: paymentNote?.length
                ? paymentNote
                : undefined
        };
        const accountslen = Number(serialized.shift());
        for (let j = 0; j < accountslen; j++) {
            const iban = serialized.shift();
            if (iban === undefined || iban.length === 0) {
                throw new Error("Missing IBAN");
            }
            const bic = serialized.shift();
            const account = {
                iban: iban,
                bic: bic?.length
                    ? bic
                    : undefined
            };
            cleanEmptyProps(account);
            payment.bankAccounts.push(account);
        }
        serialized.shift(); // StandingOrderExt
        serialized.shift(); // DirectDebitExt
        // narrowing payment type
        switch (payment.type) {
            case index_js_1.PaymentOptions.PaymentOrder:
                break;
            case index_js_1.PaymentOptions.StandingOrder:
                payment = {
                    ...payment,
                    day: Number(serialized.shift()),
                    month: Number(serialized.shift()),
                    periodicity: serialized.shift(),
                    lastDate: serialized.shift()
                };
                break;
            case index_js_1.PaymentOptions.DirectDebit:
                payment = {
                    ...payment,
                    directDebitScheme: Number(serialized.shift()),
                    directDebitType: Number(serialized.shift()),
                    mandateId: serialized.shift(),
                    creditorId: serialized.shift(),
                    contractId: serialized.shift(),
                    maxAmount: Number(serialized.shift()),
                    validTillDate: serialized.shift()
                };
                break;
            default:
                break;
        }
        cleanEmptyProps(payment);
        output.payments.push(payment);
    }
    for (let i = 0; i < paymentslen; i++) {
        const name = serialized.shift();
        const addressLine1 = serialized.shift();
        const addressLine2 = serialized.shift();
        if (Boolean(name) || Boolean(addressLine1) || Boolean(addressLine2)) {
            const beneficiary = {
                name: name?.length
                    ? name
                    : undefined,
                street: addressLine1?.length
                    ? addressLine1
                    : undefined,
                city: addressLine2?.length
                    ? addressLine2
                    : undefined
            };
            cleanEmptyProps(beneficiary);
            output.payments[i].beneficiary = beneficiary;
        }
    }
    return output;
}
exports.deserialize = deserialize;
/**
 * LZMA compression properties from the byte
 *
 * @param props 1-byte size
 */
function LzmaPropertiesDecoder(props) {
    const byte = props[0];
    return {
        lc: byte >> 5,
        lp: byte >> 2 & 0b0111,
        pb: byte & 0b0011
    };
}
function calcLzmaDictionarySize(props) {
    const dictionarySize = new ArrayBuffer(4);
    new DataView(dictionarySize).setUint32(0, Math.pow(2, props.pb + props.lp));
    return new Uint8Array(dictionarySize);
}
/**
 * The function uses bit-shifting and masking to convert the first two bytes of
 * the input header array into four nibbles representing the bysquare header
 * values.
 *
 * @param header 2-bytes sie
 */
function bysquareHeaderDecoder(header) {
    const bytes = (header[0] << 8) | header[1];
    const bysquareType = bytes >> 12;
    const version = (bytes >> 8) & 0b1111;
    const documentType = (bytes >> 4) & 0b1111;
    const reserved = bytes & 0b1111;
    return {
        bysquareType,
        version,
        documentType,
        reserved
    };
}
class DecodeError extends Error {
    cause;
    name = "DecodeError";
    constructor(cause, msg) {
        super(msg);
        this.cause = cause;
    }
}
exports.DecodeError = DecodeError;
/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 */
function parse(qr) {
    try {
        var bytes = rfc4648_1.base32hex.parse(qr, {
            loose: true
        });
    }
    catch (error) {
        throw new DecodeError(error, "Unable to decode QR string base32hex encoding");
    }
    const bysquareHeader = bytes.slice(0, 2);
    const { version } = bysquareHeaderDecoder(bysquareHeader);
    if ((version > 1 /* Version["1.1.0"] */)) {
        throw new Error("Unsupported Bysquare version");
    }
    /**
     * The process of decompressing data requires the addition of an LZMA header
     * to the compressed data. This header is necessary for the decompression
     * algorithm to properly interpret and extract the original uncompressed
     * data. Bysquare only store properties
     *
     * <----------------------- 13-bytes ----------------------->
     *
     * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
     * | Properties |  Dictionary Size  |   Uncompressed Size   |
     * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
     */
    const lzmaProperties = bytes.slice(2, 3);
    const decodedProps = LzmaPropertiesDecoder(lzmaProperties);
    const dictSize = calcLzmaDictionarySize(decodedProps);
    const header = new Uint8Array([
        lzmaProperties[0],
        ...dictSize,
        /** Uncompressed size, this value indicates that size is unknown */
        ...[0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
    ]);
    const payload = bytes.slice(4);
    const body = new Uint8Array([
        ...header,
        ...payload
    ]);
    try {
        var decompressed = new Uint8Array(lzma.decompress(body));
    }
    catch (error) {
        throw new DecodeError(error, "LZMA decompression failed");
    }
    const dataLength = bytes.slice(3, 4);
    if (dataLength[0] !== decompressed.length) {
        throw new Error("The length of the data after decompression is not as expected.");
    }
    const _checksum = decompressed.slice(0, 4);
    const decompressedBody = decompressed.slice(4);
    const decoded = new TextDecoder("utf-8").decode(decompressedBody);
    return deserialize(decoded);
}
exports.parse = parse;
/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
function detect(qr) {
    try {
        var parsed = rfc4648_1.base32hex.parse(qr, {
            loose: true
        });
    }
    catch {
        throw new Error("Invalid data, Unable to decode base32hex QR string");
    }
    if (parsed.byteLength < 2) {
        return false;
    }
    const bysquareHeader = parsed.subarray(0, 2);
    const { bysquareType, version, documentType, reserved } = bysquareHeaderDecoder(bysquareHeader);
    const isValid = [bysquareType, version, documentType, reserved]
        .every((nibble, index) => {
        if (index === 1) {
            return nibble <= 1 /* Version["1.1.0"] */;
        }
        return 0x00 <= nibble && nibble <= 0x0F;
    });
    return isValid;
}
exports.detect = detect;

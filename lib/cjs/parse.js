"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detect = exports.parse = exports.serialize = void 0;
const rfc4648_1 = require("rfc4648");
// @ts-ignore: missing types
const lzma_1 = __importDefault(require("lzma"));
const index_js_1 = require("./index.js");
function cleanEmptyProps(obj) {
    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'undefined') {
            delete obj[key];
        }
    });
}
/**
 * @see 3.14. Generating by square Code
 */
function serialize(qr) {
    const intermediate = qr
        .split("\t")
        /** The end of the qr-string might contain a NULL-terminated string */
        .map((entry) => entry.replace("\x00", ""));
    const invoiceId = intermediate.shift();
    const output = {
        invoiceId: invoiceId?.length ? invoiceId : undefined,
        payments: []
    };
    const paymentslen = Number(intermediate.shift());
    for (let i = 0; i < paymentslen; i++) {
        const paymentOptions = intermediate.shift();
        const ammount = intermediate.shift();
        const currency = intermediate.shift();
        const dueDate = intermediate.shift();
        const variables = intermediate.shift();
        const constants = intermediate.shift();
        const specifics = intermediate.shift();
        const originatorRefInfo = intermediate.shift();
        const paymentNote = intermediate.shift();
        let payment = {
            type: Number(paymentOptions),
            bankAccounts: [],
            amount: ammount?.length ? Number(ammount) : undefined,
            currencyCode: currency,
            paymentDueDate: dueDate?.length ? dueDate : undefined,
            variableSymbol: variables?.length ? variables : undefined,
            constantSymbol: constants?.length ? constants : undefined,
            specificSymbol: specifics?.length ? specifics : undefined,
            originatorRefInfo: originatorRefInfo?.length ? originatorRefInfo : undefined,
            paymentNote: paymentNote?.length ? paymentNote : undefined,
        };
        const accountslen = Number(intermediate.shift());
        for (let j = 0; j < accountslen; j++) {
            const iban = intermediate.shift();
            if (iban === undefined || iban.length === 0) {
                throw new Error("Missing IBAN");
            }
            const bic = intermediate.shift();
            const account = {
                iban: iban,
                bic: bic?.length ? bic : undefined,
            };
            cleanEmptyProps(account);
            payment.bankAccounts.push(account);
        }
        intermediate.shift(); // StandingOrderExt
        intermediate.shift(); // DirectDebitExt
        // narrowing payment type
        switch (payment.type) {
            case index_js_1.PaymentOptions.PaymentOrder:
                break;
            case index_js_1.PaymentOptions.StandingOrder:
                payment = {
                    ...payment,
                    day: Number(intermediate.shift()),
                    month: Number(intermediate.shift()),
                    periodicity: intermediate.shift(),
                    lastDate: intermediate.shift()
                };
                break;
            case index_js_1.PaymentOptions.DirectDebit:
                payment = {
                    ...payment,
                    directDebitScheme: Number(intermediate.shift()),
                    directDebitType: Number(intermediate.shift()),
                    mandateId: intermediate.shift(),
                    creditorId: intermediate.shift(),
                    contractId: intermediate.shift(),
                    maxAmount: Number(intermediate.shift()),
                    validTillDate: intermediate.shift()
                };
                break;
            default:
                break;
        }
        cleanEmptyProps(payment);
        output.payments.push(payment);
    }
    for (let i = 0; i < paymentslen; i++) {
        const name = intermediate.shift();
        const addressLine1 = intermediate.shift();
        const addressLine2 = intermediate.shift();
        if (Boolean(name) || Boolean(addressLine1) || Boolean(addressLine2)) {
            const beneficiary = {
                name: name?.length ? name : undefined,
                street: addressLine1?.length ? addressLine1 : undefined,
                city: addressLine2?.length ? addressLine2 : undefined,
            };
            cleanEmptyProps(beneficiary);
            output.payments[i].beneficiary = beneficiary;
        }
    }
    return output;
}
exports.serialize = serialize;
/**
 * @see 3.16. Decoding client data from QR Code 2005 symbol
 */
function parse(qr) {
    try {
        var decoded = rfc4648_1.base32hex.parse(qr, {
            loose: true
        });
    }
    catch {
        throw new Error("Unable to parse QR");
    }
    /**
     * Omited lzma header based on properties lc: 3, lp: 0, pb: 2
     *
     * The LZMA files has a 13-byte header that is followed by the LZMA
     * compressed data. The LZMA header consists of:
     *
     * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
     * | Properties |  Dictionary Size  |   Uncompressed Size   |
     * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
     *
     * @see https://docs.fileformat.com/compression/lzma/
     * @see https://en.wikipedia.org/wiki/Lempel–Ziv–Markov_chain_algorithm
     */
    const header = new Uint8Array([
        0x5D /** lc <0,8> lp<0,4> pb <0,4> = lc + (lp * 9) + (pb * 9 * 5) */,
        0x00, 0x00, 0x80, 0x00,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF /** Uncompressed Size 64-bit little endian integer */
    ]);
    const _bysquareHeader = decoded.slice(0, 2);
    const _sizeChecksum = decoded.slice(2, 4);
    const body = new Uint8Array([
        ...header,
        ...decoded.slice(4),
    ]);
    const decompressed = lzma_1.default.decompress(body);
    const _crc32 = decompressed.slice(0, 4);
    const deserialized = strFromUTF8Array(decompressed.slice(4));
    return serialize(deserialized);
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
        throw new Error("Unable to parse QR string, invalid data");
    }
    if (parsed.byteLength < 2) {
        return false;
    }
    const header = parsed.subarray(0, 2);
    const valid = [...hexStrFromUint8(header)]
        .map((nibble) => parseInt(nibble, 16))
        .every((nibble, index) => {
        if ( /** version */index === 1) {
            return 0 >= nibble && nibble <= 1;
        }
        return 0 <= nibble && nibble <= 15;
    });
    return valid;
}
exports.detect = detect;
// https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript#answer-34310051
function hexStrFromUint8(bytes) {
    return Array.from(bytes, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}
// https://stackoverflow.com/questions/17191945/conversion-between-utf-8-arraybuffer-and-string#answer-22373135
function strFromUTF8Array(bytes) {
    let out, i, len, c;
    let char2, char3;
    out = "";
    len = bytes.length;
    i = 0;
    while (i < len) {
        c = bytes[i++];
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = bytes[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = bytes[i++];
                char3 = bytes[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}

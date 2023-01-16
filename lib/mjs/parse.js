import lzma from "lzma-native";
import { base32hex } from "rfc4648";
import { PaymentOptions } from "./index.js";
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
export function buildModel(qr) {
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
            case PaymentOptions.PaymentOrder:
                break;
            case PaymentOptions.StandingOrder:
                payment = {
                    ...payment,
                    day: Number(intermediate.shift()),
                    month: Number(intermediate.shift()),
                    periodicity: intermediate.shift(),
                    lastDate: intermediate.shift()
                };
                break;
            case PaymentOptions.DirectDebit:
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
/**
 * @see 3.16. Decoding client data from QR Code 2005 symbol
 */
export function parse(qr) {
    try {
        var decoded = base32hex.parse(qr, {
            out: Buffer,
            loose: true
        });
    }
    catch {
        throw new Error("Unable to parse QR");
    }
    // const bysquareHeader = decoded.subarray(0, 2)
    // const compressionHeader = decoded.subarray(2, 4)
    const compressedData = decoded.subarray(4);
    // @ts-ignore: Missing decored types
    const decoder = lzma.createStream("rawDecoder", {
        synchronous: true,
        // @ts-ignore: Missing filter types
        filters: [{ id: lzma.FILTER_LZMA1 }]
    });
    return new Promise((resolve, reject) => {
        decoder
            .on("data", (decompress) => {
            // const crc32: Buffer = decompress.subarray(0, 4)
            const tabbed = decompress.subarray(4).toString();
            resolve(buildModel(tabbed));
        })
            .on("error", reject)
            .write(compressedData, (error) => {
            error && reject(error);
            decoder.end();
        });
    });
}
/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export function detect(qr) {
    try {
        var parsed = base32hex.parse(qr, {
            out: Buffer,
            loose: true
        });
    }
    catch {
        throw new Error("Unable to parse QR string, invalid data");
    }
    if (parsed.byteLength < 2) {
        return false;
    }
    const headerBysquare = parsed.subarray(0, 2);
    return [...headerBysquare.toString("hex")]
        .map((nibble) => parseInt(nibble, 16))
        .every((nibble, index) => {
        if ( /** version */index === 1) {
            return 0 >= nibble && nibble <= 1;
        }
        return 0 <= nibble && nibble <= 15;
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
/**
 * Consider native JS or WASM version for web compatibility
 * Types out of date (DefinitelyTyped)
 */
const lzma = require("lzma-native");
/**
 * "Apendix D - data model overview"
 * Data model atributes must follow the order
 * */
var MODEL_INDEX;
(function (MODEL_INDEX) {
    MODEL_INDEX[MODEL_INDEX["InvoiceID"] = 0] = "InvoiceID";
    MODEL_INDEX[MODEL_INDEX["Payments"] = 1] = "Payments";
    MODEL_INDEX[MODEL_INDEX["PaymentOptions"] = 2] = "PaymentOptions";
    MODEL_INDEX[MODEL_INDEX["Amount"] = 3] = "Amount";
    MODEL_INDEX[MODEL_INDEX["CurrencyCode"] = 4] = "CurrencyCode";
    MODEL_INDEX[MODEL_INDEX["PaymentDueDate"] = 5] = "PaymentDueDate";
    MODEL_INDEX[MODEL_INDEX["VariableSymbol"] = 6] = "VariableSymbol";
    MODEL_INDEX[MODEL_INDEX["ConstantSymbol"] = 7] = "ConstantSymbol";
    MODEL_INDEX[MODEL_INDEX["SpecificSymbol"] = 8] = "SpecificSymbol";
    MODEL_INDEX[MODEL_INDEX["OriginatorsReferenceInformation"] = 9] = "OriginatorsReferenceInformation";
    MODEL_INDEX[MODEL_INDEX["PaymentNote"] = 10] = "PaymentNote";
    MODEL_INDEX[MODEL_INDEX["BankAccounts"] = 11] = "BankAccounts";
    MODEL_INDEX[MODEL_INDEX["IBAN"] = 12] = "IBAN";
    MODEL_INDEX[MODEL_INDEX["BIC"] = 13] = "BIC";
    MODEL_INDEX[MODEL_INDEX["StandingOrderExt"] = 14] = "StandingOrderExt";
    MODEL_INDEX[MODEL_INDEX["Day"] = 15] = "Day";
    MODEL_INDEX[MODEL_INDEX["Month"] = 16] = "Month";
    MODEL_INDEX[MODEL_INDEX["Periodicity"] = 17] = "Periodicity";
    MODEL_INDEX[MODEL_INDEX["LastDate"] = 18] = "LastDate";
    MODEL_INDEX[MODEL_INDEX["DirectDebitExt"] = 19] = "DirectDebitExt";
    MODEL_INDEX[MODEL_INDEX["DirectDebitScheme"] = 20] = "DirectDebitScheme";
    MODEL_INDEX[MODEL_INDEX["DirectDebitType"] = 21] = "DirectDebitType";
    MODEL_INDEX[MODEL_INDEX["VariableSymbol_"] = 22] = "VariableSymbol_";
    MODEL_INDEX[MODEL_INDEX["SpecificSymbol_"] = 23] = "SpecificSymbol_";
    MODEL_INDEX[MODEL_INDEX["OriginatorsReferenceInformation_"] = 24] = "OriginatorsReferenceInformation_";
    MODEL_INDEX[MODEL_INDEX["MandateID"] = 25] = "MandateID";
    MODEL_INDEX[MODEL_INDEX["CreditorID"] = 26] = "CreditorID";
    MODEL_INDEX[MODEL_INDEX["ContractID"] = 27] = "ContractID";
    MODEL_INDEX[MODEL_INDEX["MaxAmount"] = 28] = "MaxAmount";
    MODEL_INDEX[MODEL_INDEX["ValidTillDate"] = 29] = "ValidTillDate";
    MODEL_INDEX[MODEL_INDEX["BeneficiaryName"] = 30] = "BeneficiaryName";
    MODEL_INDEX[MODEL_INDEX["BeneficiaryAddressLine1"] = 31] = "BeneficiaryAddressLine1";
    MODEL_INDEX[MODEL_INDEX["BeneficiaryAddressLine2"] = 32] = "BeneficiaryAddressLine2";
})(MODEL_INDEX || (MODEL_INDEX = {}));
function generate(model, cbResult) {
    /**
     * Map object litteral to ordered array
     * then join to tabbedString by specification
     */
    const data = Object.keys(model)
        .reduce((acc, curr) => {
        acc[MODEL_INDEX[curr]] = String(model[curr]);
        return acc;
    }, Array(33).fill(""))
        .join("\t");
    const checksumHexString = lzma.crc32(data, "utf-8").toString(16);
    const dataBufferWithChecksum = Buffer.concat([
        Buffer.from(checksumHexString, "hex").reverse(),
        Buffer.from(data, "utf-8"),
    ]);
    if (cbResult === undefined) {
        return new Promise(compress);
    }
    if (cbResult !== undefined) {
        compress(cbResult);
    }
    function compress(cbResult) {
        const rawEncoderStream = lzma.createStream("rawEncoder", {
            filters: [
                {
                    id: lzma.FILTER_LZMA1,
                    lc: 3,
                    lp: 0,
                    pb: 2,
                    dict_size: 2 ** 17,
                },
            ],
        });
        rawEncoderStream.write(dataBufferWithChecksum, undefined, () => {
            rawEncoderStream.end();
        });
        const dataChunks = [];
        rawEncoderStream.on("data", (data) => {
            dataChunks.push(data);
        });
        rawEncoderStream.on("end", () => {
            const bySquareHeader = Buffer.alloc(2);
            const checksum = Buffer.alloc(2);
            checksum.writeInt8(dataBufferWithChecksum.byteLength);
            const result = Buffer.concat([
                bySquareHeader,
                checksum,
                Buffer.concat(dataChunks),
            ]);
            let paddedBinString = result.reduce((acc, byte) => (acc += byte.toString(2).padStart(8, "0")), "");
            let paddedBinLength = paddedBinString.length;
            const remainder = paddedBinLength % 5;
            if (remainder) {
                paddedBinString += Array(5 - remainder).join("0");
                paddedBinLength += 5 - remainder;
            }
            const subst = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
            let output = "";
            for (let i = 0; i < paddedBinLength / 5; i++) {
                const key = parseInt(paddedBinString.slice(5 * i, 5 * i + 5), 2);
                output += subst[key];
            }
            cbResult(output);
        });
    }
}
exports.generate = generate;
//# sourceMappingURL=module.js.map
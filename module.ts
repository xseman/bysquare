import { strictEqual } from "assert";

/**
 * Consider native JS or WASM version for web compatibility
 * Types out of date (DefinitelyTyped)
 */
import * as lzma from "lzma-native";

type CurrencyCodes = "AED" | "AFN" | "ALL" | "AMD" | "ANG" | "AOA" | "ARS" | "AUD" | "AWG" | "AZN" | "BAM" | "BBD" | "BDT" | "BGN" | "BHD" | "BIF" | "BMD" | "BND" | "BOB" | "BOV" | "BRL" | "BSD" | "BTN" | "BWP" | "BYR" | "BZD" | "CAD" | "CDF" | "CHE" | "CHF" | "CHW" | "CLF" | "CLP" | "CNY" | "COP" | "COU" | "CRC" | "CUC" | "CUP" | "CVE" | "CZK" | "DJF" | "DKK" | "DOP" | "DZD" | "EGP" | "ERN" | "ETB" | "EUR" | "FJD" | "FKP" | "GBP" | "GEL" | "GHS" | "GIP" | "GMD" | "GNF" | "GTQ" | "GYD" | "HKD" | "HNL" | "HRK" | "HTG" | "HUF" | "IDR" | "ILS" | "INR" | "IQD" | "IRR" | "ISK" | "JMD" | "JOD" | "JPY" | "KES" | "KGS" | "KHR" | "KMF" | "KPW" | "KRW" | "KWD" | "KYD" | "KZT" | "LAK" | "LBP" | "LKR" | "LRD" | "LSL" | "LTL" | "LVL" | "LYD" | "MAD" | "MDL" | "MGA" | "MKD" | "MMK" | "MNT" | "MOP" | "MRO" | "MUR" | "MVR" | "MWK" | "MXN" | "MXV" | "MYR" | "MZN" | "NAD" | "NGN" | "NIO" | "NOK" | "NPR" | "NZD" | "OMR" | "PAB" | "PEN" | "PGK" | "PHP" | "PKR" | "PLN" | "PYG" | "QAR" | "RON" | "RSD" | "RUB" | "RWF" | "SAR" | "SBD" | "SCR" | "SDG" | "SEK" | "SGD" | "SHP" | "SLL" | "SOS" | "SRD" | "SSP" | "STD" | "SYP" | "SZL" | "THB" | "TJS" | "TMT" | "TND" | "TOP" | "TRY" | "TTD" | "TWD" | "TZS" | "UAH" | "UGX" | "USD" | "USN" | "USS" | "UYI" | "UYU" | "UZS" | "VEF" | "VND" | "VUV" | "WST" | "XAF" | "XAG" | "XAU" | "XBA" | "XBB" | "XBC" | "XBD" | "XCD" | "XDR" | "XFU" | "XOF" | "XPD" | "XPF" | "XPT" | "XTS" | "XXX" | "YER" | "ZAR" | "ZMW";

/**
 * Data model by "Appendix D" table
 */
export interface Model {
    /** Max length 10 */
    InvoiceID?: string,
    /** count */
    Payments: number,
    /** Max length 1 */
    PaymentOptions: number,
    /**
     * Max length 15
     * Format #.########
     * */
    Amount: number,
    /**
     * Max length 3
     * Representation ISO 4217
     *  */
    CurrencyCode: CurrencyCodes,
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    PaymentDueDate?: string,
    /** Max length 10 */
    VariableSymbol?: string,
    /** Max length 4 */
    ConstantSymbol?: string,
    /** Max length 10 */
    SpecificSymbol?: string,
    /** Max length 35 */
    OriginatorsReferenceInformation?: string,
    /** Max length 140 */
    PaymentNote?: string,
    /** count */
    BankAccounts: number,
    /** Max length 34 */
    IBAN: string,
    /**
     * Max length 11
     * Format ISO 9362, 8 or 11 characters long
     * */
    BIC?: string,
    /** Max length 1 */
    StandingOrderExt?: number,
    /** Max length 2 */
    Day?: number,
    /** Max length 4 */
    Month?: number,
    /** Max length 1 */
    Periodicity?: string,
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    LastDate?: string,
    /** Max length 1 */
    DirectDebitExt?: number,
    /** Max length 1 */
    DirectDebitScheme?: number,
    /** Max length 1 */
    DirectDebitType?: number,
    /** Max length 10 */
    VariableSymbol_?: string,
    /** Max length 10 */
    SpecificSymbol_?: string,
    /** Max length 35 */
    OriginatorsReferenceInformation_?: string,
    /** Max length 35 */
    MandateID?: string,
    /** Max length 35 */
    CreditorID?: string,
    /** Max length 35 */
    ContractID?: string,
    /**
     * Max length 15
     * Format #.########
     * */
    MaxAmount?: number,
    /**
     * Max length 8
     * Format YYYYMMDD
     */
    ValidTillDate?: string,
    /** Max length 70 */
    BeneficiaryName?: string,
    /** Max length 70 */
    BeneficiaryAddressLine1?: string,
    /** Max length 70 */
    BeneficiaryAddressLine2?: string,
}

/**
 * Data model atributes must follow the order, "Apendix D - data model overview"
 * @returns index of data model keys
 * */
enum ModelAttributeIndexes {
    InvoiceID,
    Payments,
    PaymentOptions,
    Amount,
    CurrencyCode,
    PaymentDueDate,
    VariableSymbol,
    ConstantSymbol,
    SpecificSymbol,
    OriginatorsReferenceInformation,
    PaymentNote,
    BankAccounts,
    IBAN,
    BIC,
    StandingOrderExt,
    Day,
    Month,
    Periodicity,
    LastDate,
    DirectDebitExt,
    DirectDebitScheme,
    DirectDebitType,
    VariableSymbol_,
    SpecificSymbol_,
    OriginatorsReferenceInformation_,
    MandateID,
    CreditorID,
    ContractID,
    MaxAmount,
    ValidTillDate,
    BeneficiaryName,
    BeneficiaryAddressLine1,
    BeneficiaryAddressLine2,
};

export function generate(model: Model, cbResult: (result: string) => void) {
    /**
     * Map object litteral to ordered array
     * then join to tabbedString by specification
     */
    const data = Object.keys(model)
        .reduce((acc, curr) => {
            acc[ModelAttributeIndexes[curr as keyof Model]] = String(
                model[curr as keyof Model]
            );
            return acc;
        }, Array<string>(33).fill(""))
        .join("\t");

    const checksumHexString = ((lzma.crc32(
        data,
        "utf-8"
    ) as unknown) as number).toString(16);

    const dataBufferWithChecksum = Buffer.concat([
        Buffer.from(checksumHexString, "hex").reverse(),
        Buffer.from(data, "utf-8"),
    ]);

    const rawEncoderStream = lzma.createStream("rawEncoder", {
        filters: [
            {
                id: (lzma as any).FILTER_LZMA1,
                lc: 3,
                lp: 0,
                pb: 2,
                dict_size: 2 ** 17, // 128 kilobytes
            },
        ],
    } as any);

    const compressedChunks: Buffer[] = [];
    rawEncoderStream.on("data", (chunk) => {
        compressedChunks.push(chunk);
    });

    rawEncoderStream.on("end", () => {
        const checksumLength = Buffer.alloc(2);
        checksumLength.writeInt8(dataBufferWithChecksum.byteLength);

        const compressedWithLength = Buffer.concat([
            Buffer.alloc(2), // square header
            checksumLength,
            Buffer.concat(compressedChunks),
        ]);

        let paddedBinString = compressedWithLength.reduce((acc, byte) => {
            return (acc += byte.toString(2).padStart(8, "0"));
        }, "");

        let paddedBinLength = paddedBinString.length;
        const remainder = paddedBinLength % 5;

        if (remainder) {
            paddedBinString += Array(5 - remainder).join("0");
            paddedBinLength += 5 - remainder;
        }

        const subst = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
        let result = "";
        for (let i = 0; i < paddedBinLength / 5; i++) {
            const key = parseInt(paddedBinString.slice(5 * i, 5 * i + 5), 2);
            result += subst[key];
        }

        cbResult(result);
    });

    rawEncoderStream.end(dataBufferWithChecksum);
}

const model: Model = {
    IBAN: "SK9611000000002918599669",
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

const modelOutput = '0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000'

/**
 * Should generate valid QR string from data model
 */
generate(model, (result) => {
    strictEqual(result, modelOutput);
});

// generate(model, console.log);

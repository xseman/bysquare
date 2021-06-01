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
    InvoiceID?: string;
    /** count */
    Payments: number;
    /** Max length 1 */
    PaymentOptions: number;
    /**
     * Max length 15
     * Format #.########
     * */
    Amount: number;
    /**
     * Max length 3
     * Representation ISO 4217
     *  */
    CurrencyCode: CurrencyCodes;
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    PaymentDueDate?: string;
    /** Max length 10 */
    VariableSymbol?: string;
    /** Max length 4 */
    ConstantSymbol?: string;
    /** Max length 10 */
    SpecificSymbol?: string;
    /** Max length 35 */
    OriginatorsReferenceInformation?: string;
    /** Max length 140 */
    PaymentNote?: string;
    /** count */
    BankAccounts: number;
    /** Max length 34 */
    IBAN: string;
    /**
     * Max length 11
     * Format ISO 9362, 8 or 11 characters long
     * */
    BIC?: string;
    /** Max length 1 */
    StandingOrderExt?: number;
    /** Max length 2 */
    Day?: number;
    /** Max length 4 */
    Month?: number;
    /** Max length 1 */
    Periodicity?: string;
    /**
     * Max length 8
     * Format YYYYMMDD
     * */
    LastDate?: string;
    /** Max length 1 */
    DirectDebitExt?: number;
    /** Max length 1 */
    DirectDebitScheme?: number;
    /** Max length 1 */
    DirectDebitType?: number;
    /** Max length 10 */
    VariableSymbol_?: string;
    /** Max length 10 */
    SpecificSymbol_?: string;
    /** Max length 35 */
    OriginatorsReferenceInformation_?: string;
    /** Max length 35 */
    MandateID?: string;
    /** Max length 35 */
    CreditorID?: string;
    /** Max length 35 */
    ContractID?: string;
    /**
     * Max length 15
     * Format #.########
     * */
    MaxAmount?: number;
    /**
     * Max length 8
     * Format YYYYMMDD
     */
    ValidTillDate?: string;
    /** Max length 70 */
    BeneficiaryName?: string;
    /** Max length 70 */
    BeneficiaryAddressLine1?: string;
    /** Max length 70 */
    BeneficiaryAddressLine2?: string;
}

/**
 * "Apendix D - data model overview"
 * Data model atributes must follow the order
 * */
enum MODEL_INDEX {
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
}

/**
 * Returns generated qr-string
 * @param model
 * @returns {Promise<string>}
 */
function generate(model: Model): Promise<string>;

/**
 * Returns generated qr-string as callback
 * @param model
 * @param cbResult
 */
function generate(model: Model, cbResult: (qrString: string) => void): void;

function generate(
    model: Model,
    cbResult?: (qrString: string) => void
): Promise<string> | void {
    /**
     * Map object litteral to ordered array
     * then join to tabbedString by specification
     */
    const data = (Object.keys(model) as (keyof Model)[])
        .reduce<string[]>((acc, curr) => {
            acc[MODEL_INDEX[curr]] = String(model[curr]);
            return acc;
        }, Array<string>(33).fill(""))
        .join("\t");

    const checksumHexString = (
        lzma.crc32(data, "utf-8") as unknown as number
    ).toString(16);

    const dataBufferWithChecksum = Buffer.concat([
        Buffer.from(checksumHexString, "hex").reverse(),
        Buffer.from(data, "utf-8"),
    ]);

    if (cbResult === undefined) {
        return new Promise<string>(compress);
    }

    if (cbResult !== undefined) {
        compress(cbResult);
    }

    function compress(cbResult: (qrString: string) => void): void {
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

        rawEncoderStream.write(dataBufferWithChecksum, undefined, (): void => {
            rawEncoderStream.end();
        });

        const dataChunks: Buffer[] = [];
        rawEncoderStream.on("data", (data: Buffer): void => {
            dataChunks.push(data);
        });

        rawEncoderStream.on("end", (): void => {
            const bySquareHeader = Buffer.alloc(2);
            const checksum = Buffer.alloc(2);
            checksum.writeInt8(dataBufferWithChecksum.byteLength);

            const result = Buffer.concat([
                bySquareHeader,
                checksum,
                Buffer.concat(dataChunks),
            ]);
            let paddedBinString = result.reduce<string>(
                (acc, byte) => (acc += byte.toString(2).padStart(8, "0")),
                ""
            );
            let paddedBinLength = paddedBinString.length;
            const remainder = paddedBinLength % 5;
            if (remainder) {
                paddedBinString += Array(5 - remainder).join("0");
                paddedBinLength += 5 - remainder;
            }

            const subst = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
            let output = "";
            for (let i = 0; i < paddedBinLength / 5; i++) {
                const key = parseInt(
                    paddedBinString.slice(5 * i, 5 * i + 5),
                    2
                );
                output += subst[key];
            }
            cbResult(output);
        });
    }
}

export { generate };

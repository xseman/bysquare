declare type CurrencyCodes = "AED" | "AFN" | "ALL" | "AMD" | "ANG" | "AOA" | "ARS" | "AUD" | "AWG" | "AZN" | "BAM" | "BBD" | "BDT" | "BGN" | "BHD" | "BIF" | "BMD" | "BND" | "BOB" | "BOV" | "BRL" | "BSD" | "BTN" | "BWP" | "BYR" | "BZD" | "CAD" | "CDF" | "CHE" | "CHF" | "CHW" | "CLF" | "CLP" | "CNY" | "COP" | "COU" | "CRC" | "CUC" | "CUP" | "CVE" | "CZK" | "DJF" | "DKK" | "DOP" | "DZD" | "EGP" | "ERN" | "ETB" | "EUR" | "FJD" | "FKP" | "GBP" | "GEL" | "GHS" | "GIP" | "GMD" | "GNF" | "GTQ" | "GYD" | "HKD" | "HNL" | "HRK" | "HTG" | "HUF" | "IDR" | "ILS" | "INR" | "IQD" | "IRR" | "ISK" | "JMD" | "JOD" | "JPY" | "KES" | "KGS" | "KHR" | "KMF" | "KPW" | "KRW" | "KWD" | "KYD" | "KZT" | "LAK" | "LBP" | "LKR" | "LRD" | "LSL" | "LTL" | "LVL" | "LYD" | "MAD" | "MDL" | "MGA" | "MKD" | "MMK" | "MNT" | "MOP" | "MRO" | "MUR" | "MVR" | "MWK" | "MXN" | "MXV" | "MYR" | "MZN" | "NAD" | "NGN" | "NIO" | "NOK" | "NPR" | "NZD" | "OMR" | "PAB" | "PEN" | "PGK" | "PHP" | "PKR" | "PLN" | "PYG" | "QAR" | "RON" | "RSD" | "RUB" | "RWF" | "SAR" | "SBD" | "SCR" | "SDG" | "SEK" | "SGD" | "SHP" | "SLL" | "SOS" | "SRD" | "SSP" | "STD" | "SYP" | "SZL" | "THB" | "TJS" | "TMT" | "TND" | "TOP" | "TRY" | "TTD" | "TWD" | "TZS" | "UAH" | "UGX" | "USD" | "USN" | "USS" | "UYI" | "UYU" | "UZS" | "VEF" | "VND" | "VUV" | "WST" | "XAF" | "XAG" | "XAU" | "XBA" | "XBB" | "XBC" | "XBD" | "XCD" | "XDR" | "XFU" | "XOF" | "XPD" | "XPF" | "XPT" | "XTS" | "XXX" | "YER" | "ZAR" | "ZMW";
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
 * Returns generated qr-string
 * @param model
 * @returns {Promise<string>}
 */
declare function generate(model: Model): Promise<string>;
/**
 * Returns generated qr-string as callback
 * @param model
 * @param cbResult
 */
declare function generate(model: Model, cbResult: (qrString: string) => void): void;
export { generate };
//# sourceMappingURL=module.d.ts.map
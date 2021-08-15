"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.parse = exports.generate = void 0;
/**
 * TODO:
 * - Native JS or WASM version for web compatibility
 * - lzma types out of date (DefinitelyTyped)
 */
const lzma = __importStar(require("lzma-native"));
/* Active ISO 4217 */
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["AED"] = "United Arab Emirates Dirham";
    CurrencyCode["AFN"] = "Afghanistan Afghani";
    CurrencyCode["ALL"] = "Albania Lek";
    CurrencyCode["AMD"] = "Armenia Dram";
    CurrencyCode["ANG"] = "Netherlands Antilles Guilder";
    CurrencyCode["AOA"] = "Angola Kwanza";
    CurrencyCode["ARS"] = "Argentina Peso";
    CurrencyCode["AUD"] = "Australia Dollar";
    CurrencyCode["AWG"] = "Aruba Guilder";
    CurrencyCode["AZN"] = "Azerbaijan New Manat";
    CurrencyCode["BAM"] = "Bosnia and Herzegovina Convertible Marka";
    CurrencyCode["BBD"] = "Barbados Dollar";
    CurrencyCode["BDT"] = "Bangladesh Taka";
    CurrencyCode["BGN"] = "Bulgaria Lev";
    CurrencyCode["BHD"] = "Bahrain Dinar";
    CurrencyCode["BIF"] = "Burundi Franc";
    CurrencyCode["BMD"] = "Bermuda Dollar";
    CurrencyCode["BND"] = "Brunei Darussalam Dollar";
    CurrencyCode["BOB"] = "Bolivia Bol\u00EDviano";
    CurrencyCode["BRL"] = "Brazil Real";
    CurrencyCode["BSD"] = "Bahamas Dollar";
    CurrencyCode["BTN"] = "Bhutan Ngultrum";
    CurrencyCode["BWP"] = "Botswana Pula";
    CurrencyCode["BYR"] = "Belarus Ruble";
    CurrencyCode["BZD"] = "Belize Dollar";
    CurrencyCode["CAD"] = "Canada Dollar";
    CurrencyCode["CDF"] = "Congo/Kinshasa Franc";
    CurrencyCode["CHF"] = "Switzerland Franc";
    CurrencyCode["CLP"] = "Chile Peso";
    CurrencyCode["CNY"] = "China Yuan Renminbi";
    CurrencyCode["COP"] = "Colombia Peso";
    CurrencyCode["CRC"] = "Costa Rica Colon";
    CurrencyCode["CUC"] = "Cuba Convertible Peso";
    CurrencyCode["CUP"] = "Cuba Peso";
    CurrencyCode["CVE"] = "Cape Verde Escudo";
    CurrencyCode["CZK"] = "Czech Republic Koruna";
    CurrencyCode["DJF"] = "Djibouti Franc";
    CurrencyCode["DKK"] = "Denmark Krone";
    CurrencyCode["DOP"] = "Dominican Republic Peso";
    CurrencyCode["DZD"] = "Algeria Dinar";
    CurrencyCode["EGP"] = "Egypt Pound";
    CurrencyCode["ERN"] = "Eritrea Nakfa";
    CurrencyCode["ETB"] = "Ethiopia Birr";
    CurrencyCode["EUR"] = "Euro Member Countries";
    CurrencyCode["FJD"] = "Fiji Dollar";
    CurrencyCode["FKP"] = "Falkland Islands  = Malvinas Pound";
    CurrencyCode["GBP"] = "United Kingdom Pound";
    CurrencyCode["GEL"] = "Georgia Lari";
    CurrencyCode["GGP"] = "Guernsey Pound";
    CurrencyCode["GHS"] = "Ghana Cedi";
    CurrencyCode["GIP"] = "Gibraltar Pound";
    CurrencyCode["GMD"] = "Gambia Dalasi";
    CurrencyCode["GNF"] = "Guinea Franc";
    CurrencyCode["GTQ"] = "Guatemala Quetzal";
    CurrencyCode["GYD"] = "Guyana Dollar";
    CurrencyCode["HKD"] = "Hong Kong Dollar";
    CurrencyCode["HNL"] = "Honduras Lempira";
    CurrencyCode["HRK"] = "Croatia Kuna";
    CurrencyCode["HTG"] = "Haiti Gourde";
    CurrencyCode["HUF"] = "Hungary Forint";
    CurrencyCode["IDR"] = "Indonesia Rupiah";
    CurrencyCode["ILS"] = "Israel Shekel";
    CurrencyCode["IMP"] = "Isle of Man Pound";
    CurrencyCode["INR"] = "India Rupee";
    CurrencyCode["IQD"] = "Iraq Dinar";
    CurrencyCode["IRR"] = "Iran Rial";
    CurrencyCode["ISK"] = "Iceland Krona";
    CurrencyCode["JEP"] = "Jersey Pound";
    CurrencyCode["JMD"] = "Jamaica Dollar";
    CurrencyCode["JOD"] = "Jordan Dinar";
    CurrencyCode["JPY"] = "Japan Yen";
    CurrencyCode["KES"] = "Kenya Shilling";
    CurrencyCode["KGS"] = "Kyrgyzstan Som";
    CurrencyCode["KHR"] = "Cambodia Riel";
    CurrencyCode["KMF"] = "Comoros Franc";
    CurrencyCode["KPW"] = "Korea  = North Won";
    CurrencyCode["KRW"] = "Korea  = South Won";
    CurrencyCode["KWD"] = "Kuwait Dinar";
    CurrencyCode["KYD"] = "Cayman Islands Dollar";
    CurrencyCode["KZT"] = "Kazakhstan Tenge";
    CurrencyCode["LAK"] = "Laos Kip";
    CurrencyCode["LBP"] = "Lebanon Pound";
    CurrencyCode["LKR"] = "Sri Lanka Rupee";
    CurrencyCode["LRD"] = "Liberia Dollar";
    CurrencyCode["LSL"] = "Lesotho Loti";
    CurrencyCode["LYD"] = "Libya Dinar";
    CurrencyCode["MAD"] = "Morocco Dirham";
    CurrencyCode["MDL"] = "Moldova Leu";
    CurrencyCode["MGA"] = "Madagascar Ariary";
    CurrencyCode["MKD"] = "Macedonia Denar";
    CurrencyCode["MMK"] = "Myanmar  = Burma Kyat";
    CurrencyCode["MNT"] = "Mongolia Tughrik";
    CurrencyCode["MOP"] = "Macau Pataca";
    CurrencyCode["MRO"] = "Mauritania Ouguiya";
    CurrencyCode["MUR"] = "Mauritius Rupee";
    CurrencyCode["MVR"] = "Maldives  = Maldive Islands Rufiyaa";
    CurrencyCode["MWK"] = "Malawi Kwacha";
    CurrencyCode["MXN"] = "Mexico Peso";
    CurrencyCode["MYR"] = "Malaysia Ringgit";
    CurrencyCode["MZN"] = "Mozambique Metical";
    CurrencyCode["NAD"] = "Namibia Dollar";
    CurrencyCode["NGN"] = "Nigeria Naira";
    CurrencyCode["NIO"] = "Nicaragua Cordoba";
    CurrencyCode["NOK"] = "Norway Krone";
    CurrencyCode["NPR"] = "Nepal Rupee";
    CurrencyCode["NZD"] = "New Zealand Dollar";
    CurrencyCode["OMR"] = "Oman Rial";
    CurrencyCode["PAB"] = "Panama Balboa";
    CurrencyCode["PEN"] = "Peru Sol";
    CurrencyCode["PGK"] = "Papua New Guinea Kina";
    CurrencyCode["PHP"] = "Philippines Peso";
    CurrencyCode["PKR"] = "Pakistan Rupee";
    CurrencyCode["PLN"] = "Poland Zloty";
    CurrencyCode["PYG"] = "Paraguay Guarani";
    CurrencyCode["QAR"] = "Qatar Riyal";
    CurrencyCode["RON"] = "Romania New Leu";
    CurrencyCode["RSD"] = "Serbia Dinar";
    CurrencyCode["RUB"] = "Russia Ruble";
    CurrencyCode["RWF"] = "Rwanda Franc";
    CurrencyCode["SAR"] = "Saudi Arabia Riyal";
    CurrencyCode["SBD"] = "Solomon Islands Dollar";
    CurrencyCode["SCR"] = "Seychelles Rupee";
    CurrencyCode["SDG"] = "Sudan Pound";
    CurrencyCode["SEK"] = "Sweden Krona";
    CurrencyCode["SGD"] = "Singapore Dollar";
    CurrencyCode["SHP"] = "Saint Helena Pound";
    CurrencyCode["SLL"] = "Sierra Leone Leone";
    CurrencyCode["SOS"] = "Somalia Shilling";
    CurrencyCode["SPL"] = "Seborga Luigino";
    CurrencyCode["SRD"] = "Suriname Dollar";
    CurrencyCode["STD"] = "S\u00E3o Tom\u00E9 and Pr\u00EDncipe Dobra";
    CurrencyCode["SVC"] = "El Salvador Colon";
    CurrencyCode["SYP"] = "Syria Pound";
    CurrencyCode["SZL"] = "Swaziland Lilangeni";
    CurrencyCode["THB"] = "Thailand Baht";
    CurrencyCode["TJS"] = "Tajikistan Somoni";
    CurrencyCode["TMT"] = "Turkmenistan Manat";
    CurrencyCode["TND"] = "Tunisia Dinar";
    CurrencyCode["TOP"] = "Tonga Pa'anga";
    CurrencyCode["TRY"] = "Turkey Lira";
    CurrencyCode["TTD"] = "Trinidad and Tobago Dollar";
    CurrencyCode["TVD"] = "Tuvalu Dollar";
    CurrencyCode["TWD"] = "Taiwan New Dollar";
    CurrencyCode["TZS"] = "Tanzania Shilling";
    CurrencyCode["UAH"] = "Ukraine Hryvnia";
    CurrencyCode["UGX"] = "Uganda Shilling";
    CurrencyCode["USD"] = "United States Dollar";
    CurrencyCode["UYU"] = "Uruguay Peso";
    CurrencyCode["UZS"] = "Uzbekistan Som";
    CurrencyCode["VEF"] = "Venezuela Bolivar";
    CurrencyCode["VND"] = "Viet Nam Dong";
    CurrencyCode["VUV"] = "Vanuatu Vatu";
    CurrencyCode["WST"] = "Samoa Tala";
    CurrencyCode["XAF"] = "Communaut\u00E9 Financi\u00E8re Africaine  = BEAC CFA Franc BEAC";
    CurrencyCode["XCD"] = "East Caribbean Dollar";
    CurrencyCode["XDR"] = "International Monetary Fund  = IMF Special Drawing Rights";
    CurrencyCode["XOF"] = "Communaut\u00E9 Financi\u00E8re Africaine  = BCEAO Franc";
    CurrencyCode["XPF"] = "Comptoirs Fran\u00E7ais du Pacifique  = CFP Franc";
    CurrencyCode["YER"] = "Yemen Rial";
    CurrencyCode["ZAR"] = "South Africa Rand";
    CurrencyCode["ZMW"] = "Zambia Kwacha";
    CurrencyCode["ZWD"] = "Zimbabwe Dollar";
})(CurrencyCode || (CurrencyCode = {}));
/**
 * "Apendix D - data model overview"
 * Data model atributes must follow the order
 */
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
function generate(model, callback) {
    /**
     * Map object litteral to ordered Array size at 33
     * Join entries to tabbed-string by specification
     */
    const data = Object.keys(model)
        .reduce((acc, curr) => {
        acc[MODEL_INDEX[curr]] = String(model[curr] ?? "");
        return acc;
    }, Array(33).fill(""))
        .join("\t");
    const checksumHexString = lzma.crc32(data, "utf-8").toString(16);
    const dataBufferWithChecksum = Buffer.concat([
        Buffer.from(checksumHexString, "hex").reverse(),
        Buffer.from(data, "utf-8"),
    ]);
    if (callback) {
        compress(callback, console.error);
    }
    else {
        return new Promise(compress);
    }
    function compress(resolve, reject) {
        const stream = lzma.createStream("rawEncoder", {
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
        stream.write(dataBufferWithChecksum, undefined, () => {
            stream.end();
        });
        const dataChunks = [];
        stream.on("data", (data) => {
            dataChunks.push(data);
        });
        stream.on("error", (err) => {
            throw err;
        });
        stream.on("end", () => {
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
            /**
             * We map a binary number of 5 bits to a string representation 2^5
             * "0123456789ABCDEFGHIJKLMNOPQRSTUV"[<0-32>] represents char
             */
            const subst = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
            let output = "";
            for (let i = 0; i < paddedBinLength / 5; i++) {
                const binStart = 5 * i;
                const binEnd = 5 * i + 5;
                const slice = paddedBinString.slice(binStart, binEnd);
                const key = parseInt(slice, 2);
                output += subst[key];
            }
            resolve(output);
        });
    }
}
exports.generate = generate;
function parse(qrString, callback) {
    qrString.split(qrString);
    if (callback) {
        callback({
            IBAN: "SK9611000000002918599669",
            Amount: 100.0,
            CurrencyCode: "EUR",
            VariableSymbol: "123",
            Payments: 1,
            PaymentOptions: 1,
            BankAccounts: 1,
        });
    }
    else {
        return new Promise((resolve, reject) => {
            resolve({
                IBAN: "SK9611000000002918599669",
                Amount: 100.0,
                CurrencyCode: "EUR",
                VariableSymbol: "123",
                Payments: 1,
                PaymentOptions: 1,
                BankAccounts: 1,
            });
        });
    }
}
exports.parse = parse;
//# sourceMappingURL=module.js.map
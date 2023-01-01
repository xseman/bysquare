/**
 * Mapping semantic version to encoded version number, header 4-bits
 *
 * It's a bit silly to limit the version number to 4-bit, if they keep
 * increasing the version number, the latest possible mapped value is 16
 */
var Version;
(function (Version) {
    /**
     * 2013-02-22
     * Created this document from original by square specifications
     */
    Version[Version["1.0.0"] = 0] = "1.0.0";
    /**
     * 2015-06-24
     * Added fields for beneficiary name and address
     */
    Version[Version["1.1.0"] = 1] = "1.1.0";
})(Version || (Version = {}));
export var PaymentOptionsEnum;
(function (PaymentOptionsEnum) {
    PaymentOptionsEnum[PaymentOptionsEnum["PaymentOrder"] = 1] = "PaymentOrder";
    PaymentOptionsEnum[PaymentOptionsEnum["StandingOrder"] = 2] = "StandingOrder";
    PaymentOptionsEnum[PaymentOptionsEnum["DirectDebit"] = 4] = "DirectDebit";
})(PaymentOptionsEnum = PaymentOptionsEnum || (PaymentOptionsEnum = {}));
export var MonthClassifier;
(function (MonthClassifier) {
    MonthClassifier[MonthClassifier["January"] = 1] = "January";
    MonthClassifier[MonthClassifier["February"] = 2] = "February";
    MonthClassifier[MonthClassifier["March"] = 4] = "March";
    MonthClassifier[MonthClassifier["April"] = 8] = "April";
    MonthClassifier[MonthClassifier["May"] = 16] = "May";
    MonthClassifier[MonthClassifier["June"] = 32] = "June";
    MonthClassifier[MonthClassifier["July"] = 64] = "July";
    MonthClassifier[MonthClassifier["August"] = 128] = "August";
    MonthClassifier[MonthClassifier["September"] = 256] = "September";
    MonthClassifier[MonthClassifier["October"] = 512] = "October";
    MonthClassifier[MonthClassifier["November"] = 1024] = "November";
    MonthClassifier[MonthClassifier["December"] = 2048] = "December"; // 2^11
})(MonthClassifier = MonthClassifier || (MonthClassifier = {}));
export var PeriodicityClassifier;
(function (PeriodicityClassifier) {
    PeriodicityClassifier["Daily"] = "d";
    PeriodicityClassifier["Weekly"] = "w";
    PeriodicityClassifier["Biweekly"] = "b";
    PeriodicityClassifier["Monthly"] = "m";
    PeriodicityClassifier["Bimonthly"] = "B";
    PeriodicityClassifier["Quarterly"] = "q";
    PeriodicityClassifier["Semiannually"] = "s";
    PeriodicityClassifier["Annually"] = "a";
})(PeriodicityClassifier = PeriodicityClassifier || (PeriodicityClassifier = {}));
export var DirectDebitType;
(function (DirectDebitType) {
    DirectDebitType[DirectDebitType["OneOff"] = 0] = "OneOff";
    DirectDebitType[DirectDebitType["Recurrent"] = 1] = "Recurrent";
})(DirectDebitType = DirectDebitType || (DirectDebitType = {}));
export var DirectDebitScheme;
(function (DirectDebitScheme) {
    DirectDebitScheme[DirectDebitScheme["Other"] = 0] = "Other";
    DirectDebitScheme[DirectDebitScheme["Sepa"] = 1] = "Sepa";
})(DirectDebitScheme = DirectDebitScheme || (DirectDebitScheme = {}));
/**
 * Atributes must follow specific order
 * Based on Table 15. PAY by square sequence data model (page 30.)
 *
 * @see{./docs/specification_v1.1.0.pdf}
 */
export var SequenceOrder;
(function (SequenceOrder) {
    SequenceOrder[SequenceOrder["InvoiceID"] = 0] = "InvoiceID";
    SequenceOrder[SequenceOrder["Payments"] = 1] = "Payments";
    SequenceOrder[SequenceOrder["PaymentOptions"] = 2] = "PaymentOptions";
    SequenceOrder[SequenceOrder["Amount"] = 3] = "Amount";
    SequenceOrder[SequenceOrder["CurrencyCode"] = 4] = "CurrencyCode";
    SequenceOrder[SequenceOrder["PaymentDueDate"] = 5] = "PaymentDueDate";
    SequenceOrder[SequenceOrder["VariableSymbol"] = 6] = "VariableSymbol";
    SequenceOrder[SequenceOrder["ConstantSymbol"] = 7] = "ConstantSymbol";
    SequenceOrder[SequenceOrder["SpecificSymbol"] = 8] = "SpecificSymbol";
    SequenceOrder[SequenceOrder["OriginatorsReferenceInformation"] = 9] = "OriginatorsReferenceInformation";
    SequenceOrder[SequenceOrder["PaymentNote"] = 10] = "PaymentNote";
    SequenceOrder[SequenceOrder["BankAccounts"] = 11] = "BankAccounts";
    SequenceOrder[SequenceOrder["IBAN"] = 12] = "IBAN";
    SequenceOrder[SequenceOrder["BIC"] = 13] = "BIC";
    SequenceOrder[SequenceOrder["StandingOrderExt"] = 14] = "StandingOrderExt";
    SequenceOrder[SequenceOrder["Day"] = 15] = "Day";
    SequenceOrder[SequenceOrder["Month"] = 16] = "Month";
    SequenceOrder[SequenceOrder["Periodicity"] = 17] = "Periodicity";
    SequenceOrder[SequenceOrder["LastDate"] = 18] = "LastDate";
    SequenceOrder[SequenceOrder["DirectDebitExt"] = 19] = "DirectDebitExt";
    SequenceOrder[SequenceOrder["DirectDebitScheme"] = 20] = "DirectDebitScheme";
    SequenceOrder[SequenceOrder["DirectDebitType"] = 21] = "DirectDebitType";
    SequenceOrder[SequenceOrder["VariableSymbol_"] = 22] = "VariableSymbol_";
    SequenceOrder[SequenceOrder["SpecificSymbol_"] = 23] = "SpecificSymbol_";
    SequenceOrder[SequenceOrder["OriginatorsReferenceInformation_"] = 24] = "OriginatorsReferenceInformation_";
    SequenceOrder[SequenceOrder["MandateID"] = 25] = "MandateID";
    SequenceOrder[SequenceOrder["CreditorID"] = 26] = "CreditorID";
    SequenceOrder[SequenceOrder["ContractID"] = 27] = "ContractID";
    SequenceOrder[SequenceOrder["MaxAmount"] = 28] = "MaxAmount";
    SequenceOrder[SequenceOrder["ValidTillDate"] = 29] = "ValidTillDate";
    SequenceOrder[SequenceOrder["BeneficiaryName"] = 30] = "BeneficiaryName";
    SequenceOrder[SequenceOrder["BeneficiaryAddressLine1"] = 31] = "BeneficiaryAddressLine1";
    SequenceOrder[SequenceOrder["BeneficiaryAddressLine2"] = 32] = "BeneficiaryAddressLine2";
})(SequenceOrder = SequenceOrder || (SequenceOrder = {}));
/**
 * Currency codes based on ISO 4217
 */
export var CurrencyCodeEnum;
(function (CurrencyCodeEnum) {
    CurrencyCodeEnum["AED"] = "United Arab Emirates Dirham";
    CurrencyCodeEnum["AFN"] = "Afghanistan Afghani";
    CurrencyCodeEnum["ALL"] = "Albania Lek";
    CurrencyCodeEnum["AMD"] = "Armenia Dram";
    CurrencyCodeEnum["ANG"] = "Netherlands Antilles Guilder";
    CurrencyCodeEnum["AOA"] = "Angola Kwanza";
    CurrencyCodeEnum["ARS"] = "Argentina Peso";
    CurrencyCodeEnum["AUD"] = "Australia Dollar";
    CurrencyCodeEnum["AWG"] = "Aruba Guilder";
    CurrencyCodeEnum["AZN"] = "Azerbaijan New Manat";
    CurrencyCodeEnum["BAM"] = "Bosnia and Herzegovina Convertible Marka";
    CurrencyCodeEnum["BBD"] = "Barbados Dollar";
    CurrencyCodeEnum["BDT"] = "Bangladesh Taka";
    CurrencyCodeEnum["BGN"] = "Bulgaria Lev";
    CurrencyCodeEnum["BHD"] = "Bahrain Dinar";
    CurrencyCodeEnum["BIF"] = "Burundi Franc";
    CurrencyCodeEnum["BMD"] = "Bermuda Dollar";
    CurrencyCodeEnum["BND"] = "Brunei Darussalam Dollar";
    CurrencyCodeEnum["BOB"] = "Bolivia Bol\u00EDviano";
    CurrencyCodeEnum["BRL"] = "Brazil Real";
    CurrencyCodeEnum["BSD"] = "Bahamas Dollar";
    CurrencyCodeEnum["BTN"] = "Bhutan Ngultrum";
    CurrencyCodeEnum["BWP"] = "Botswana Pula";
    CurrencyCodeEnum["BYR"] = "Belarus Ruble";
    CurrencyCodeEnum["BZD"] = "Belize Dollar";
    CurrencyCodeEnum["CAD"] = "Canada Dollar";
    CurrencyCodeEnum["CDF"] = "Congo/Kinshasa Franc";
    CurrencyCodeEnum["CHF"] = "Switzerland Franc";
    CurrencyCodeEnum["CLP"] = "Chile Peso";
    CurrencyCodeEnum["CNY"] = "China Yuan Renminbi";
    CurrencyCodeEnum["COP"] = "Colombia Peso";
    CurrencyCodeEnum["CRC"] = "Costa Rica Colon";
    CurrencyCodeEnum["CUC"] = "Cuba Convertible Peso";
    CurrencyCodeEnum["CUP"] = "Cuba Peso";
    CurrencyCodeEnum["CVE"] = "Cape Verde Escudo";
    CurrencyCodeEnum["CZK"] = "Czech Republic Koruna";
    CurrencyCodeEnum["DJF"] = "Djibouti Franc";
    CurrencyCodeEnum["DKK"] = "Denmark Krone";
    CurrencyCodeEnum["DOP"] = "Dominican Republic Peso";
    CurrencyCodeEnum["DZD"] = "Algeria Dinar";
    CurrencyCodeEnum["EGP"] = "Egypt Pound";
    CurrencyCodeEnum["ERN"] = "Eritrea Nakfa";
    CurrencyCodeEnum["ETB"] = "Ethiopia Birr";
    CurrencyCodeEnum["EUR"] = "Euro Member Countries";
    CurrencyCodeEnum["FJD"] = "Fiji Dollar";
    CurrencyCodeEnum["FKP"] = "Falkland Islands  = Malvinas Pound";
    CurrencyCodeEnum["GBP"] = "United Kingdom Pound";
    CurrencyCodeEnum["GEL"] = "Georgia Lari";
    CurrencyCodeEnum["GGP"] = "Guernsey Pound";
    CurrencyCodeEnum["GHS"] = "Ghana Cedi";
    CurrencyCodeEnum["GIP"] = "Gibraltar Pound";
    CurrencyCodeEnum["GMD"] = "Gambia Dalasi";
    CurrencyCodeEnum["GNF"] = "Guinea Franc";
    CurrencyCodeEnum["GTQ"] = "Guatemala Quetzal";
    CurrencyCodeEnum["GYD"] = "Guyana Dollar";
    CurrencyCodeEnum["HKD"] = "Hong Kong Dollar";
    CurrencyCodeEnum["HNL"] = "Honduras Lempira";
    CurrencyCodeEnum["HRK"] = "Croatia Kuna";
    CurrencyCodeEnum["HTG"] = "Haiti Gourde";
    CurrencyCodeEnum["HUF"] = "Hungary Forint";
    CurrencyCodeEnum["IDR"] = "Indonesia Rupiah";
    CurrencyCodeEnum["ILS"] = "Israel Shekel";
    CurrencyCodeEnum["IMP"] = "Isle of Man Pound";
    CurrencyCodeEnum["INR"] = "India Rupee";
    CurrencyCodeEnum["IQD"] = "Iraq Dinar";
    CurrencyCodeEnum["IRR"] = "Iran Rial";
    CurrencyCodeEnum["ISK"] = "Iceland Krona";
    CurrencyCodeEnum["JEP"] = "Jersey Pound";
    CurrencyCodeEnum["JMD"] = "Jamaica Dollar";
    CurrencyCodeEnum["JOD"] = "Jordan Dinar";
    CurrencyCodeEnum["JPY"] = "Japan Yen";
    CurrencyCodeEnum["KES"] = "Kenya Shilling";
    CurrencyCodeEnum["KGS"] = "Kyrgyzstan Som";
    CurrencyCodeEnum["KHR"] = "Cambodia Riel";
    CurrencyCodeEnum["KMF"] = "Comoros Franc";
    CurrencyCodeEnum["KPW"] = "Korea  = North Won";
    CurrencyCodeEnum["KRW"] = "Korea  = South Won";
    CurrencyCodeEnum["KWD"] = "Kuwait Dinar";
    CurrencyCodeEnum["KYD"] = "Cayman Islands Dollar";
    CurrencyCodeEnum["KZT"] = "Kazakhstan Tenge";
    CurrencyCodeEnum["LAK"] = "Laos Kip";
    CurrencyCodeEnum["LBP"] = "Lebanon Pound";
    CurrencyCodeEnum["LKR"] = "Sri Lanka Rupee";
    CurrencyCodeEnum["LRD"] = "Liberia Dollar";
    CurrencyCodeEnum["LSL"] = "Lesotho Loti";
    CurrencyCodeEnum["LYD"] = "Libya Dinar";
    CurrencyCodeEnum["MAD"] = "Morocco Dirham";
    CurrencyCodeEnum["MDL"] = "Moldova Leu";
    CurrencyCodeEnum["MGA"] = "Madagascar Ariary";
    CurrencyCodeEnum["MKD"] = "Macedonia Denar";
    CurrencyCodeEnum["MMK"] = "Myanmar  = Burma Kyat";
    CurrencyCodeEnum["MNT"] = "Mongolia Tughrik";
    CurrencyCodeEnum["MOP"] = "Macau Pataca";
    CurrencyCodeEnum["MRO"] = "Mauritania Ouguiya";
    CurrencyCodeEnum["MUR"] = "Mauritius Rupee";
    CurrencyCodeEnum["MVR"] = "Maldives  = Maldive Islands Rufiyaa";
    CurrencyCodeEnum["MWK"] = "Malawi Kwacha";
    CurrencyCodeEnum["MXN"] = "Mexico Peso";
    CurrencyCodeEnum["MYR"] = "Malaysia Ringgit";
    CurrencyCodeEnum["MZN"] = "Mozambique Metical";
    CurrencyCodeEnum["NAD"] = "Namibia Dollar";
    CurrencyCodeEnum["NGN"] = "Nigeria Naira";
    CurrencyCodeEnum["NIO"] = "Nicaragua Cordoba";
    CurrencyCodeEnum["NOK"] = "Norway Krone";
    CurrencyCodeEnum["NPR"] = "Nepal Rupee";
    CurrencyCodeEnum["NZD"] = "New Zealand Dollar";
    CurrencyCodeEnum["OMR"] = "Oman Rial";
    CurrencyCodeEnum["PAB"] = "Panama Balboa";
    CurrencyCodeEnum["PEN"] = "Peru Sol";
    CurrencyCodeEnum["PGK"] = "Papua New Guinea Kina";
    CurrencyCodeEnum["PHP"] = "Philippines Peso";
    CurrencyCodeEnum["PKR"] = "Pakistan Rupee";
    CurrencyCodeEnum["PLN"] = "Poland Zloty";
    CurrencyCodeEnum["PYG"] = "Paraguay Guarani";
    CurrencyCodeEnum["QAR"] = "Qatar Riyal";
    CurrencyCodeEnum["RON"] = "Romania New Leu";
    CurrencyCodeEnum["RSD"] = "Serbia Dinar";
    CurrencyCodeEnum["RUB"] = "Russia Ruble";
    CurrencyCodeEnum["RWF"] = "Rwanda Franc";
    CurrencyCodeEnum["SAR"] = "Saudi Arabia Riyal";
    CurrencyCodeEnum["SBD"] = "Solomon Islands Dollar";
    CurrencyCodeEnum["SCR"] = "Seychelles Rupee";
    CurrencyCodeEnum["SDG"] = "Sudan Pound";
    CurrencyCodeEnum["SEK"] = "Sweden Krona";
    CurrencyCodeEnum["SGD"] = "Singapore Dollar";
    CurrencyCodeEnum["SHP"] = "Saint Helena Pound";
    CurrencyCodeEnum["SLL"] = "Sierra Leone Leone";
    CurrencyCodeEnum["SOS"] = "Somalia Shilling";
    CurrencyCodeEnum["SPL"] = "Seborga Luigino";
    CurrencyCodeEnum["SRD"] = "Suriname Dollar";
    CurrencyCodeEnum["STD"] = "S\u00E3o Tom\u00E9 and Pr\u00EDncipe Dobra";
    CurrencyCodeEnum["SVC"] = "El Salvador Colon";
    CurrencyCodeEnum["SYP"] = "Syria Pound";
    CurrencyCodeEnum["SZL"] = "Swaziland Lilangeni";
    CurrencyCodeEnum["THB"] = "Thailand Baht";
    CurrencyCodeEnum["TJS"] = "Tajikistan Somoni";
    CurrencyCodeEnum["TMT"] = "Turkmenistan Manat";
    CurrencyCodeEnum["TND"] = "Tunisia Dinar";
    CurrencyCodeEnum["TOP"] = "Tonga Pa'anga";
    CurrencyCodeEnum["TRY"] = "Turkey Lira";
    CurrencyCodeEnum["TTD"] = "Trinidad and Tobago Dollar";
    CurrencyCodeEnum["TVD"] = "Tuvalu Dollar";
    CurrencyCodeEnum["TWD"] = "Taiwan New Dollar";
    CurrencyCodeEnum["TZS"] = "Tanzania Shilling";
    CurrencyCodeEnum["UAH"] = "Ukraine Hryvnia";
    CurrencyCodeEnum["UGX"] = "Uganda Shilling";
    CurrencyCodeEnum["USD"] = "United States Dollar";
    CurrencyCodeEnum["UYU"] = "Uruguay Peso";
    CurrencyCodeEnum["UZS"] = "Uzbekistan Som";
    CurrencyCodeEnum["VEF"] = "Venezuela Bolivar";
    CurrencyCodeEnum["VND"] = "Viet Nam Dong";
    CurrencyCodeEnum["VUV"] = "Vanuatu Vatu";
    CurrencyCodeEnum["WST"] = "Samoa Tala";
    CurrencyCodeEnum["XAF"] = "Communaut\u00E9 Financi\u00E8re Africaine  = BEAC CFA Franc BEAC";
    CurrencyCodeEnum["XCD"] = "East Caribbean Dollar";
    CurrencyCodeEnum["XDR"] = "International Monetary Fund  = IMF Special Drawing Rights";
    CurrencyCodeEnum["XOF"] = "Communaut\u00E9 Financi\u00E8re Africaine  = BCEAO Franc";
    CurrencyCodeEnum["XPF"] = "Comptoirs Fran\u00E7ais du Pacifique  = CFP Franc";
    CurrencyCodeEnum["YER"] = "Yemen Rial";
    CurrencyCodeEnum["ZAR"] = "South Africa Rand";
    CurrencyCodeEnum["ZMW"] = "Zambia Kwacha";
    CurrencyCodeEnum["ZWD"] = "Zimbabwe Dollar";
})(CurrencyCodeEnum = CurrencyCodeEnum || (CurrencyCodeEnum = {}));

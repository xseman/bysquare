/**
 * Data model
 * (Appendix D, table)
 */
export interface Model {
    /** Max length 10 */
    InvoiceID?: string;

    /** count */
    Payments: number;

    /**
     * Needs to be filled in with “paymentorder” option
     *
     * Max length 1
     */
    PaymentOptions: number;
    /**
     * Encoded with amount payable. This field is not required and can be left
     * blank in cases payment amount is not known ­such as donations.
     *
     * Max length 15
     * Format #.########
     */
    Amount?: number;

    /**
     * 3 letter, payment currency code according to ISO 4217
     *
     * Max length 3
     * Representation ISO 4217
     */
    CurrencyCode: keyof typeof CurrencyCode;

    /**
     * Optional field
     *
     * Max length 8
     * Format YYYYMMDD
     */
    PaymentDueDate?: string

    /** Max length 10 */
    VariableSymbol?: string

    /** Max length 4 */
    ConstantSymbol?: string

    /** Max length 10 */
    SpecificSymbol?: string

    /** Max length 35 */
    OriginatorsReferenceInformation?: string

    /**
     * Optional field. In previous section we provide further recommendations
     * for encoding payment note.
     *
     * Max length 140
     */
    PaymentNote?: string

    /**
     * In section „encoding BankAccounts“ we provide further recommendations for
     * encoding bank account
     */
    BankAccounts: number

    /** Max length 34 */
    IBAN: string

    /**
     * Max length 11
     * Format ISO 9362, 8 or 11 characters long
     */
    BIC?: string

    /** Max length 1 */
    StandingOrderExt?: number

    /**
     * This is the payment day. It‘s meaning depends on the periodicity, meaning
     * either day of the month (number between 1 and 31) or day of the week
     * (1=Monday,2=Tuesday, …, 7=Sunday).
     *
     * Max length 2
     * */
    Day?: number

    /**
     * Selection of one or more months on which payment occurs. This is enabled
     * only if periodicity is set to one of the following value: “Weekly,
     * Biweekly, Monthly, Bimonthly”. Otherwise it must not be specified.
     *
     * Max length 4
     */
    Month?: number

    /**
     * Periodicity of the payment. All valid options are „Daily“, „Weekly“,
     * „Biweekly“, „Monthly“, „Bimonthly“, „Quarterly“, „Annually“,
     * „Semiannually“. To find out which periodicity types are supported by the
     * banks see the following web site: http://www.sbaonline.sk/sk/
     *
     * Max length 1
     */
    Periodicity?: string

    /**
     * Defines the day of the last payment of the standing order. After this
     * date, standing order is cancelled.
     *
     * Max length 8
     * Format YYYYMMDD
     */
    LastDate?: string

    /** Max length 1 */
    DirectDebitExt?: number

    /**
     * This field can have “SEPA” value, if direct debit is using SEPA direct
     * debit scheme or “other” when an ordinary direct debit is defined
     *
     * Max length 1
     */
    DirectDebitScheme?: number

    /**
     * Can be „one­off“ for one time debit or „recurrent“ for repeated debit
     * until cancelled.
     *
     * Max length 1
     */
    DirectDebitType?: number

    /** Max length 10 */
    VariableSymbol_?: string

    /** Max length 10 */
    SpecificSymbol_?: string

    /** Max length 35 */
    OriginatorsReferenceInformation_?: string

    /** Max length 35 */
    MandateID?: string

    /** Max length 35 */
    CreditorID?: string

    /** Max length 35 */
    ContractID?: string

    /**
     * Optional field. As most users prefer to set up some maximum amount for
     * the direct debit, this can be pre­filled for them.
     *
     * Max length 15
     * Format #.########
     */
    MaxAmount?: number

    /**
     * Defines the day after which direct debit is cancelled.
     *
     * Max length 8
     * Format YYYYMMDD
     */
    ValidTillDate?: string

    /** Max length 70 */
    BeneficiaryName?: string

    /** Max length 70 */
    BeneficiaryAddressLine1?: string

    /** Max length 70 */
    BeneficiaryAddressLine2?: string;
}

/**
 * Atributes must follow specific order
 * (Apendix D - data model overview)
 */
export enum ModelOrdered {
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

/* Active ISO 4217 */
export enum CurrencyCode {
    AED = "United Arab Emirates Dirham",
    AFN = "Afghanistan Afghani",
    ALL = "Albania Lek",
    AMD = "Armenia Dram",
    ANG = "Netherlands Antilles Guilder",
    AOA = "Angola Kwanza",
    ARS = "Argentina Peso",
    AUD = "Australia Dollar",
    AWG = "Aruba Guilder",
    AZN = "Azerbaijan New Manat",
    BAM = "Bosnia and Herzegovina Convertible Marka",
    BBD = "Barbados Dollar",
    BDT = "Bangladesh Taka",
    BGN = "Bulgaria Lev",
    BHD = "Bahrain Dinar",
    BIF = "Burundi Franc",
    BMD = "Bermuda Dollar",
    BND = "Brunei Darussalam Dollar",
    BOB = "Bolivia Bolíviano",
    BRL = "Brazil Real",
    BSD = "Bahamas Dollar",
    BTN = "Bhutan Ngultrum",
    BWP = "Botswana Pula",
    BYR = "Belarus Ruble",
    BZD = "Belize Dollar",
    CAD = "Canada Dollar",
    CDF = "Congo/Kinshasa Franc",
    CHF = "Switzerland Franc",
    CLP = "Chile Peso",
    CNY = "China Yuan Renminbi",
    COP = "Colombia Peso",
    CRC = "Costa Rica Colon",
    CUC = "Cuba Convertible Peso",
    CUP = "Cuba Peso",
    CVE = "Cape Verde Escudo",
    CZK = "Czech Republic Koruna",
    DJF = "Djibouti Franc",
    DKK = "Denmark Krone",
    DOP = "Dominican Republic Peso",
    DZD = "Algeria Dinar",
    EGP = "Egypt Pound",
    ERN = "Eritrea Nakfa",
    ETB = "Ethiopia Birr",
    EUR = "Euro Member Countries",
    FJD = "Fiji Dollar",
    FKP = "Falkland Islands  = Malvinas Pound",
    GBP = "United Kingdom Pound",
    GEL = "Georgia Lari",
    GGP = "Guernsey Pound",
    GHS = "Ghana Cedi",
    GIP = "Gibraltar Pound",
    GMD = "Gambia Dalasi",
    GNF = "Guinea Franc",
    GTQ = "Guatemala Quetzal",
    GYD = "Guyana Dollar",
    HKD = "Hong Kong Dollar",
    HNL = "Honduras Lempira",
    HRK = "Croatia Kuna",
    HTG = "Haiti Gourde",
    HUF = "Hungary Forint",
    IDR = "Indonesia Rupiah",
    ILS = "Israel Shekel",
    IMP = "Isle of Man Pound",
    INR = "India Rupee",
    IQD = "Iraq Dinar",
    IRR = "Iran Rial",
    ISK = "Iceland Krona",
    JEP = "Jersey Pound",
    JMD = "Jamaica Dollar",
    JOD = "Jordan Dinar",
    JPY = "Japan Yen",
    KES = "Kenya Shilling",
    KGS = "Kyrgyzstan Som",
    KHR = "Cambodia Riel",
    KMF = "Comoros Franc",
    KPW = "Korea  = North Won",
    KRW = "Korea  = South Won",
    KWD = "Kuwait Dinar",
    KYD = "Cayman Islands Dollar",
    KZT = "Kazakhstan Tenge",
    LAK = "Laos Kip",
    LBP = "Lebanon Pound",
    LKR = "Sri Lanka Rupee",
    LRD = "Liberia Dollar",
    LSL = "Lesotho Loti",
    LYD = "Libya Dinar",
    MAD = "Morocco Dirham",
    MDL = "Moldova Leu",
    MGA = "Madagascar Ariary",
    MKD = "Macedonia Denar",
    MMK = "Myanmar  = Burma Kyat",
    MNT = "Mongolia Tughrik",
    MOP = "Macau Pataca",
    MRO = "Mauritania Ouguiya",
    MUR = "Mauritius Rupee",
    MVR = "Maldives  = Maldive Islands Rufiyaa",
    MWK = "Malawi Kwacha",
    MXN = "Mexico Peso",
    MYR = "Malaysia Ringgit",
    MZN = "Mozambique Metical",
    NAD = "Namibia Dollar",
    NGN = "Nigeria Naira",
    NIO = "Nicaragua Cordoba",
    NOK = "Norway Krone",
    NPR = "Nepal Rupee",
    NZD = "New Zealand Dollar",
    OMR = "Oman Rial",
    PAB = "Panama Balboa",
    PEN = "Peru Sol",
    PGK = "Papua New Guinea Kina",
    PHP = "Philippines Peso",
    PKR = "Pakistan Rupee",
    PLN = "Poland Zloty",
    PYG = "Paraguay Guarani",
    QAR = "Qatar Riyal",
    RON = "Romania New Leu",
    RSD = "Serbia Dinar",
    RUB = "Russia Ruble",
    RWF = "Rwanda Franc",
    SAR = "Saudi Arabia Riyal",
    SBD = "Solomon Islands Dollar",
    SCR = "Seychelles Rupee",
    SDG = "Sudan Pound",
    SEK = "Sweden Krona",
    SGD = "Singapore Dollar",
    SHP = "Saint Helena Pound",
    SLL = "Sierra Leone Leone",
    SOS = "Somalia Shilling",
    SPL = "Seborga Luigino",
    SRD = "Suriname Dollar",
    STD = "São Tomé and Príncipe Dobra",
    SVC = "El Salvador Colon",
    SYP = "Syria Pound",
    SZL = "Swaziland Lilangeni",
    THB = "Thailand Baht",
    TJS = "Tajikistan Somoni",
    TMT = "Turkmenistan Manat",
    TND = "Tunisia Dinar",
    TOP = "Tonga Pa'anga",
    TRY = "Turkey Lira",
    TTD = "Trinidad and Tobago Dollar",
    TVD = "Tuvalu Dollar",
    TWD = "Taiwan New Dollar",
    TZS = "Tanzania Shilling",
    UAH = "Ukraine Hryvnia",
    UGX = "Uganda Shilling",
    USD = "United States Dollar",
    UYU = "Uruguay Peso",
    UZS = "Uzbekistan Som",
    VEF = "Venezuela Bolivar",
    VND = "Viet Nam Dong",
    VUV = "Vanuatu Vatu",
    WST = "Samoa Tala",
    XAF = "Communauté Financière Africaine  = BEAC CFA Franc BEAC",
    XCD = "East Caribbean Dollar",
    XDR = "International Monetary Fund  = IMF Special Drawing Rights",
    XOF = "Communauté Financière Africaine  = BCEAO Franc",
    XPF = "Comptoirs Français du Pacifique  = CFP Franc",
    YER = "Yemen Rial",
    ZAR = "South Africa Rand",
    ZMW = "Zambia Kwacha",
    ZWD = "Zimbabwe Dollar",
}

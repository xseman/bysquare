import Foundation

#if os(Linux)
let libName = "libbysquare.so"
#elseif os(macOS)
let libName = "libbysquare.dylib"
#else
let libName = "libbysquare.dll"
#endif

guard let lib = dlopen(libName, RTLD_NOW) else {
    fatalError("Failed to load library: \(String(cString: dlerror()))")
}

// Config bitflags
let BYSQUARE_DEBURR: Int32 = 0b00000001  // Bit 0: Enable diacritics removal

// Version values (in high byte, bits 24-31)
let BYSQUARE_VERSION_110: Int32 = 1 << 24  // v1.1.0

// Special config value for default
// PAY defaults:     v1.2.0 + deburr + validate
// Invoice defaults: v1.0.0 + validate (no deburr)
let BYSQUARE_CONFIG_DEFAULT: Int32 = -1

typealias EncodeFunc = @convention(c) (UnsafePointer<CChar>?, Int32) -> UnsafePointer<CChar>?
typealias DecodeFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias DetectTypeFunc = @convention(c) (UnsafePointer<CChar>?) -> Int32
typealias FreeFunc = @convention(c) (UnsafeMutablePointer<CChar>?) -> Void

let encode = unsafeBitCast(dlsym(lib, "bysquare_pay_encode"), to: EncodeFunc.self)
let decode = unsafeBitCast(dlsym(lib, "bysquare_pay_decode"), to: DecodeFunc.self)
let encodeInvoice = unsafeBitCast(dlsym(lib, "bysquare_invoice_encode"), to: EncodeFunc.self)
let decodeInvoice = unsafeBitCast(dlsym(lib, "bysquare_invoice_decode"), to: DecodeFunc.self)
let detectType = unsafeBitCast(dlsym(lib, "bysquare_detect_type"), to: DetectTypeFunc.self)
let free = unsafeBitCast(dlsym(lib, "bysquare_free"), to: FreeFunc.self)

defer {
    dlclose(lib)
}

let paymentJson = """
{
	"payments": [
		{
			"type": 1,
			"amount": 123.45,
			"currencyCode": "EUR",
			"variableSymbol": "987654",
			"beneficiary": {
				"name": "John Doe"
			},
			"bankAccounts": [
				{
					"iban": "SK9611000000002918599669"
				}
			]
		}
	]
}
"""

let invoiceJson = """
{
	"documentType": 0,
	"invoiceId": "FV2024001",
	"issueDate": "20240115",
	"localCurrencyCode": "EUR",
	"supplierParty": {
		"partyName": "Supplier s.r.o.",
		"postalAddress": {
			"streetName": "Hlavna 1",
			"cityName": "Bratislava",
			"postalZone": "81101",
			"country": "SVK"
		}
	},
	"customerParty": {
		"partyName": "Customer a.s."
	},
	"numberOfInvoiceLines": 1,
	"taxCategorySummaries": [
		{
			"classifiedTaxCategory": 0.2,
			"taxExclusiveAmount": 100,
			"taxAmount": 20
		}
	],
	"monetarySummary": {
		"taxExclusiveAmount": 100,
		"taxInclusiveAmount": 120
	}
}
"""

// Helper function for PAY encode + error handling
func encodeQR(_ json: String, _ config: Int32) -> String {
    let result = encode(json, config)
    let qr = String(cString: result!)
    free(UnsafeMutablePointer(mutating: result))
    if qr.hasPrefix("ERROR:") {
        fatalError("Encoding error: \(String(qr.dropFirst(6)))")
    }
    return qr
}

// Helper function for invoice encode + error handling
func encodeInvoiceQR(_ json: String, _ config: Int32) -> String {
    let result = encodeInvoice(json, config)
    let qr = String(cString: result!)
    free(UnsafeMutablePointer(mutating: result))
    if qr.hasPrefix("ERROR:") {
        fatalError("Invoice encoding error: \(String(qr.dropFirst(6)))")
    }
    return qr
}

// PAY: Default config (v1.2.0 + deburr + validate)
let qrDefault = encodeQR(paymentJson, BYSQUARE_CONFIG_DEFAULT)
print("PAY default config: \(qrDefault)")

// PAY: Custom config - version 1.1.0 with deburr only
let qrCustom = encodeQR(paymentJson, BYSQUARE_DEBURR | BYSQUARE_VERSION_110)
print("PAY custom config:  \(qrCustom)")

// PAY: Decode
let decodeResult = decode(qrDefault)
let decodedJson = String(cString: decodeResult!)
free(UnsafeMutablePointer(mutating: decodeResult))
if decodedJson.hasPrefix("ERROR:") {
    fatalError("Decoding error: \(String(decodedJson.dropFirst(6)))")
}
print("PAY decoded: \(decodedJson)")

// Invoice: Encode with defaults (v1.0.0 + validate)
let qrInvoice = encodeInvoiceQR(invoiceJson, BYSQUARE_CONFIG_DEFAULT)
print("Invoice: \(qrInvoice)")

// Invoice: Decode
let invoiceDecodeResult = decodeInvoice(qrInvoice)
let decodedInvoice = String(cString: invoiceDecodeResult!)
free(UnsafeMutablePointer(mutating: invoiceDecodeResult))
if decodedInvoice.hasPrefix("ERROR:") {
    fatalError("Invoice decoding error: \(String(decodedInvoice.dropFirst(6)))")
}
print("Invoice decoded: \(decodedInvoice)")

// Detect type (0=PAY, 1=Invoice, -1=error)
let payType = detectType(qrDefault)
let invoiceType = detectType(qrInvoice)
print("QR type (PAY): \(payType)")
print("QR type (Invoice): \(invoiceType)")


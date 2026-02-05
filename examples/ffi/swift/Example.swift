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

// Special config value for default (v1.2.0 + deburr + validate)
let BYSQUARE_CONFIG_DEFAULT: Int32 = -1

typealias EncodeFunc = @convention(c) (UnsafePointer<CChar>?, Int32) -> UnsafePointer<CChar>?
typealias DecodeFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias FreeFunc = @convention(c) (UnsafeMutablePointer<CChar>?) -> Void

let encode = unsafeBitCast(dlsym(lib, "bysquare_encode"), to: EncodeFunc.self)
let decode = unsafeBitCast(dlsym(lib, "bysquare_decode"), to: DecodeFunc.self)
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

// Helper function for encode + error handling
func encodeQR(_ config: Int32) -> String {
    let result = encode(paymentJson, config)
    let qr = String(cString: result!)
    free(UnsafeMutablePointer(mutating: result))
    if qr.hasPrefix("ERROR:") {
        fatalError("Encoding error: \(String(qr.dropFirst(6)))")
    }
    return qr
}

// Default config (v1.2.0 + deburr + validate)
let qrDefault = encodeQR(BYSQUARE_CONFIG_DEFAULT)
print("Default config: \(qrDefault)")

// Custom config - version 1.1.0 with deburr only
let qrCustom = encodeQR(BYSQUARE_DEBURR | BYSQUARE_VERSION_110)
print("Custom config:  \(qrCustom)")

// Decode
let decodeResult = decode(qrDefault)
let decodedJson = String(cString: decodeResult!)
free(UnsafeMutablePointer(mutating: decodeResult))
if decodedJson.hasPrefix("ERROR:") {
    fatalError("Decoding error: \(String(decodedJson.dropFirst(6)))")
}
print("Decoded: \(decodedJson)")


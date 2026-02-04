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
let BYSQUARE_DEBURR: Int32 = 0b00000001    // Bit 0: Enable diacritics removal
let BYSQUARE_VALIDATE: Int32 = 0b00000010  // Bit 1: Enable input validation

// Version values (in high byte, bits 24-31)
let BYSQUARE_VERSION_110: Int32 = 1 << 24  // v1.1.0 = 0b00000001_00000000_00000000_00000000

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

// Option 1: Use config=0 for automatic default (deburr + validate + v1.2.0)
let encodeResultAuto = encode(paymentJson, 0)
let qrStringAuto = String(cString: encodeResultAuto!)
free(UnsafeMutablePointer(mutating: encodeResultAuto))
if qrStringAuto.hasPrefix("ERROR:") {
    let errorMsg = String(qrStringAuto.dropFirst(6)) // Strip "ERROR:" prefix
    fatalError("Encoding error: \\(errorMsg)")
}
print("Encoded (config=0, auto-default): \(qrStringAuto)")

// Option 2: Custom config - version 1.1.0, no validation
let customConfig = BYSQUARE_DEBURR | BYSQUARE_VERSION_110
let encodeResult2 = encode(paymentJson, customConfig)
let qrStringCustom = String(cString: encodeResult2!)
free(UnsafeMutablePointer(mutating: encodeResult2))
if qrStringCustom.hasPrefix("ERROR:") {
    let errorMsg = String(qrStringCustom.dropFirst(6))
    fatalError("Encoding error: \\(errorMsg)")
}
print("Encoded (v1.1.0, no validation): \(qrStringCustom)")

// Decode
let decodeResult = decode(qrStringAuto)
let decodedJson = String(cString: decodeResult!)
free(UnsafeMutablePointer(mutating: decodeResult))
if decodedJson.hasPrefix("ERROR:") {
    let errorMsg = String(decodedJson.dropFirst(6))
    fatalError("Decoding error: \\(errorMsg)")
}
print("Decoded: \(decodedJson)")


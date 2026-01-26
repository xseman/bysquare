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

typealias CreateConfigFunc = @convention(c) () -> OpaquePointer?
typealias ConfigSetterFunc = @convention(c) (OpaquePointer?, Int32) -> Void
typealias FreeConfigFunc = @convention(c) (OpaquePointer?) -> Void
typealias EncodeFunc = @convention(c) (UnsafePointer<CChar>?, OpaquePointer?) -> UnsafePointer<CChar>?
typealias DecodeFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias FreeFunc = @convention(c) (UnsafeMutablePointer<CChar>?) -> Void

let createConfig = unsafeBitCast(dlsym(lib, "bysquare_create_config"), to: CreateConfigFunc.self)
let configSetDeburr = unsafeBitCast(dlsym(lib, "bysquare_config_set_deburr"), to: ConfigSetterFunc.self)
let configSetValidate = unsafeBitCast(dlsym(lib, "bysquare_config_set_validate"), to: ConfigSetterFunc.self)
let configSetVersion = unsafeBitCast(dlsym(lib, "bysquare_config_set_version"), to: ConfigSetterFunc.self)
let freeConfig = unsafeBitCast(dlsym(lib, "bysquare_free_config"), to: FreeConfigFunc.self)
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

// Option 1: Use defaults (pass nil for config)
// let encodeResult = encode(paymentJson, nil)

// Option 2: Create config and customize options
let config = createConfig()
configSetDeburr(config, 1)      // enable deburr
configSetValidate(config, 1)    // enable validation

// Encode
let encodeResult = encode(paymentJson, config)
let qrString = String(cString: encodeResult!)
free(UnsafeMutablePointer(mutating: encodeResult))
print("Encoded: \(qrString)")

// Decode
let decodeResult = decode(qrString)
let decodedJson = String(cString: decodeResult!)
free(UnsafeMutablePointer(mutating: decodeResult))
print("Decoded: \(decodedJson)")

// Cleanup
freeConfig(config)

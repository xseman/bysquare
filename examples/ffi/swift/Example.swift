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

typealias EncodeFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias DecodeFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias FreeFunc = @convention(c) (UnsafeMutablePointer<CChar>?) -> Void

let encode = unsafeBitCast(dlsym(lib, "bysquare_encode"), to: EncodeFunc.self)
let decode = unsafeBitCast(dlsym(lib, "bysquare_decode"), to: DecodeFunc.self)
let free = unsafeBitCast(dlsym(lib, "bysquare_free"), to: FreeFunc.self)

let json = """
{
  "payments": [{
    "type": 1,
    "amount": 123.45,
    "currencyCode": "EUR",
    "variableSymbol": "987654",
    "beneficiary": {"name": "John Doe"},
    "bankAccounts": [{"iban": "SK9611000000002918599669"}]
  }]
}
"""

let resultPtr = encode(json)
let qr = String(cString: resultPtr!)
free(UnsafeMutablePointer(mutating: resultPtr))

print("Encoded: \(qr)")

let decodedPtr = decode(qr)
let decodedJson = String(cString: decodedPtr!)
free(UnsafeMutablePointer(mutating: decodedPtr))

print("Decoded: \(decodedJson)")

dlclose(lib)

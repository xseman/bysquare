import Foundation

#if os(Linux)
let libName = "libbysquare.so"
#elseif os(macOS)
let libName = "libbysquare.dylib"
#else
let libName = "libbysquare.dll"
#endif

// Load the library
guard let lib = dlopen(libName, RTLD_NOW) else {
    fatalError("Failed to load library: \(String(cString: dlerror()))")
}

// Define function signatures
typealias GetVersionFunc = @convention(c) () -> UnsafePointer<CChar>?
typealias EncodePaymentFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias DecodeQRFunc = @convention(c) (UnsafePointer<CChar>?) -> UnsafePointer<CChar>?
typealias FreeStringFunc = @convention(c) (UnsafeMutablePointer<CChar>?) -> Void

// Load functions
guard let getVersionSym = dlsym(lib, "bysquare_version"),
      let encodePaymentSym = dlsym(lib, "bysquare_encode"),
      let decodeQRSym = dlsym(lib, "bysquare_decode"),
      let freeStringSym = dlsym(lib, "bysquare_free") else {
    fatalError("Failed to load symbols: \(String(cString: dlerror()))")
}

let getVersion = unsafeBitCast(getVersionSym, to: GetVersionFunc.self)
let encodePayment = unsafeBitCast(encodePaymentSym, to: EncodePaymentFunc.self)
let decodeQR = unsafeBitCast(decodeQRSym, to: DecodeQRFunc.self)
let freeString = unsafeBitCast(freeStringSym, to: FreeStringFunc.self)

// Payment structures
struct BankAccount: Codable {
    let iban: String
}

struct Payment: Codable {
    let type: Int
    let amount: Double
    let currencyCode: String
    let variableSymbol: String?
    let bankAccounts: [BankAccount]
}

struct PaymentData: Codable {
    let payments: [Payment]
}

// Service wrapper
class BySquareService {
    static func getLibraryVersion() -> String {
        guard let versionPtr = getVersion() else {
            return "unknown"
        }
        return String(cString: versionPtr)
    }
    
    static func encode(paymentData: PaymentData) throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        
        let jsonData = try encoder.encode(paymentData)
        guard let jsonString = String(data: jsonData, encoding: .utf8) else {
            throw NSError(domain: "BySquare", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create JSON string"])
        }
        
        guard let resultPtr = encodePayment(jsonString) else {
            throw NSError(domain: "BySquare", code: 2, userInfo: [NSLocalizedDescriptionKey: "Encoding failed"])
        }
        
        let result = String(cString: resultPtr)
        freeString(UnsafeMutablePointer(mutating: resultPtr))
        
        return result
    }
    
    static func decode(qrString: String) throws -> PaymentData {
        guard let resultPtr = decodeQR(qrString) else {
            throw NSError(domain: "BySquare", code: 3, userInfo: [NSLocalizedDescriptionKey: "Decoding failed"])
        }
        
        let jsonString = String(cString: resultPtr)
        freeString(UnsafeMutablePointer(mutating: resultPtr))
        
        guard let jsonData = jsonString.data(using: .utf8) else {
            throw NSError(domain: "BySquare", code: 4, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON data"])
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(PaymentData.self, from: jsonData)
    }
}

// Example usage
do {
    print("Library version: \(BySquareService.getLibraryVersion())")
    
    // Create payment data
    let paymentData = PaymentData(
        payments: [
            Payment(
                type: 1,
                amount: 123.45,
                currencyCode: "EUR",
                variableSymbol: "987654",
                bankAccounts: [
                    BankAccount(iban: "SK9611000000002918599669")
                ]
            )
        ]
    )
    
    // Encode to QR string
    let qrString = try BySquareService.encode(paymentData: paymentData)
    print("Encoded QR string: \(qrString)")
    
    // Decode back
    let decoded = try BySquareService.decode(qrString: qrString)
    print("Decoded payment amount: \(decoded.payments[0].amount)")
    print("Decoded IBAN: \(decoded.payments[0].bankAccounts[0].iban)")
    
} catch {
    print("Error: \(error)")
    exit(1)
}

// Cleanup
dlclose(lib)

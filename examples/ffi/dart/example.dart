
import 'dart:ffi';
import 'dart:io';

import 'package:ffi/ffi.dart';

// Config bitflags
const int bysquareDeburr = 0x00000001; // Bit 0: Enable diacritics removal

// Version values (in high byte, bits 24-31)
const int bysquareVersion110 = 1 << 24; // v1.1.0

// Special config value for defaults:
//   PAY:     v1.2.0 + deburr + validate
//   Invoice: v1.0.0 + validate (no deburr)
const int bysquareConfigDefault = -1;

// C-side native function type definitions
typedef _EncodeNative = Pointer<Char> Function(Pointer<Char> jsonData, Int32 config);
typedef _DecodeNative = Pointer<Char> Function(Pointer<Char> qrString);
typedef _DetectTypeNative = Int32 Function(Pointer<Char> qrString);
typedef _FreeNative = Void Function(Pointer<Char> ptr);

// Dart-callable function types
typedef _EncodeFunc = Pointer<Char> Function(Pointer<Char> jsonData, int config);
typedef _DecodeFunc = Pointer<Char> Function(Pointer<Char> qrString);
typedef _DetectTypeFunc = int Function(Pointer<Char> qrString);
typedef _FreeFunc = void Function(Pointer<Char> ptr);

DynamicLibrary _loadLibrary() {
    final scriptDir = File(Platform.script.toFilePath()).parent.path;
    final libDir = '$scriptDir/../../../go/bin';

    if (Platform.isLinux) {
        return DynamicLibrary.open('$libDir/libbysquare.so');
    }
    if (Platform.isMacOS) {
        return DynamicLibrary.open('$libDir/libbysquare.dylib');
    }
    if (Platform.isWindows) {
        return DynamicLibrary.open('$libDir/bysquare.dll');
    }
    throw UnsupportedError('Unsupported platform: ${Platform.operatingSystem}');
}

const _paymentJson = '''
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
}''';

const _invoiceJson = '''
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
}''';

void main() {
    final lib = _loadLibrary();

    final payEncode = lib.lookupFunction<_EncodeNative, _EncodeFunc>('bysquare_pay_encode');
    final payDecode = lib.lookupFunction<_DecodeNative, _DecodeFunc>('bysquare_pay_decode');
    final invoiceEncode = lib.lookupFunction<_EncodeNative, _EncodeFunc>('bysquare_invoice_encode');
    final invoiceDecode = lib.lookupFunction<_DecodeNative, _DecodeFunc>('bysquare_invoice_decode');
    final detectType = lib.lookupFunction<_DetectTypeNative, _DetectTypeFunc>('bysquare_detect_type');
    final bysquareFree = lib.lookupFunction<_FreeNative, _FreeFunc>('bysquare_free');

    // Encode a PAY by Square payment and return the QR string.
    String encode(String json, int config) {
        final jsonPtr = json.toNativeUtf8().cast<Char>();
        try {
            final resultPtr = payEncode(jsonPtr, config);
            final result = resultPtr.cast<Utf8>().toDartString();
            bysquareFree(resultPtr);
            if (result.startsWith('ERROR:')) {
                throw Exception('Encoding error: ${result.substring(6)}');
            }
            return result;
        } finally {
            malloc.free(jsonPtr);
        }
    }

    // Decode a PAY by Square QR string and return JSON.
    String decode(String qr) {
        final qrPtr = qr.toNativeUtf8().cast<Char>();
        try {
            final resultPtr = payDecode(qrPtr);
            final result = resultPtr.cast<Utf8>().toDartString();
            bysquareFree(resultPtr);
            if (result.startsWith('ERROR:')) {
                throw Exception('Decoding error: ${result.substring(6)}');
            }
            return result;
        } finally {
            malloc.free(qrPtr);
        }
    }

    // Encode an Invoice by Square and return the QR string.
    String encodeInvoice(String json, int config) {
        final jsonPtr = json.toNativeUtf8().cast<Char>();
        try {
            final resultPtr = invoiceEncode(jsonPtr, config);
            final result = resultPtr.cast<Utf8>().toDartString();
            bysquareFree(resultPtr);
            if (result.startsWith('ERROR:')) {
                throw Exception('Invoice encoding error: ${result.substring(6)}');
            }
            return result;
        } finally {
            malloc.free(jsonPtr);
        }
    }

    // Decode an Invoice by Square QR string and return JSON.
    String decodeInvoice(String qr) {
        final qrPtr = qr.toNativeUtf8().cast<Char>();
        try {
            final resultPtr = invoiceDecode(qrPtr);
            final result = resultPtr.cast<Utf8>().toDartString();
            bysquareFree(resultPtr);
            if (result.startsWith('ERROR:')) {
                throw Exception('Invoice decoding error: ${result.substring(6)}');
            }
            return result;
        } finally {
            malloc.free(qrPtr);
        }
    }

    // PAY: Default config (v1.2.0 + deburr + validate)
    final qrDefault = encode(_paymentJson, bysquareConfigDefault);
    print('PAY default config: $qrDefault');

    // PAY: Custom config - version 1.1.0 with deburr only
    final qrCustom = encode(_paymentJson, bysquareDeburr | bysquareVersion110);
    print('PAY custom config:  $qrCustom');

    // PAY: Decode
    final decodedPay = decode(qrDefault);
    print('PAY decoded: $decodedPay');

    // Invoice: Encode with defaults (v1.0.0 + validate)
    final qrInvoice = encodeInvoice(_invoiceJson, bysquareConfigDefault);
    print('Invoice: $qrInvoice');

    // Invoice: Decode
    final decodedInvoice = decodeInvoice(qrInvoice);
    print('Invoice decoded: $decodedInvoice');

    // Detect type (0=PAY, 1=Invoice, -1=error)
    final payQrPtr = qrDefault.toNativeUtf8().cast<Char>();
    final invoiceQrPtr = qrInvoice.toNativeUtf8().cast<Char>();
    final payType = detectType(payQrPtr);
    final invoiceType = detectType(invoiceQrPtr);
    malloc.free(payQrPtr);
    malloc.free(invoiceQrPtr);
    print('QR type (PAY): $payType');
    print('QR type (Invoice): $invoiceType');
}

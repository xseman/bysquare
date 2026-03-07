#!/usr/bin/env python3

import ctypes
import json
import sys

from pathlib import Path

lib_ext = "dylib" if sys.platform == "darwin" else "dll" if sys.platform == "win32" else "so"
lib_path = Path(__file__).parent.parent.parent.parent / "go" / "bin" / f"libbysquare.{lib_ext}"
lib = ctypes.CDLL(str(lib_path))

# Config bitflags
BYSQUARE_DEBURR = 0b00000001  # Bit 0: Enable diacritics removal

# Version values (in high byte, bits 24-31)
BYSQUARE_VERSION_110 = 1 << 24  # v1.1.0

# Special config value for default
# PAY defaults:     v1.2.0 + deburr + validate
# Invoice defaults: v1.0.0 + validate (no deburr)
BYSQUARE_CONFIG_DEFAULT = -1

# Define function signatures
lib.bysquare_pay_encode.argtypes = [ctypes.c_char_p, ctypes.c_int]
lib.bysquare_pay_encode.restype = ctypes.c_void_p
lib.bysquare_pay_decode.argtypes = [ctypes.c_char_p]
lib.bysquare_pay_decode.restype = ctypes.c_void_p
lib.bysquare_invoice_encode.argtypes = [ctypes.c_char_p, ctypes.c_int]
lib.bysquare_invoice_encode.restype = ctypes.c_void_p
lib.bysquare_invoice_decode.argtypes = [ctypes.c_char_p]
lib.bysquare_invoice_decode.restype = ctypes.c_void_p
lib.bysquare_detect_type.argtypes = [ctypes.c_char_p]
lib.bysquare_detect_type.restype = ctypes.c_int
lib.bysquare_free.argtypes = [ctypes.c_void_p]

payment_data = {
    "payments": [{
        "type": 1,
        "amount": 123.45,
        "currencyCode": "EUR",
        "variableSymbol": "987654",
        "beneficiary": {"name": "John Doe"},
        "bankAccounts": [{"iban": "SK9611000000002918599669"}]
    }]
}

invoice_data = {
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
    "taxCategorySummaries": [{
        "classifiedTaxCategory": 0.2,
        "taxExclusiveAmount": 100,
        "taxAmount": 20
    }],
    "monetarySummary": {
        "taxExclusiveAmount": 100,
        "taxInclusiveAmount": 120
    }
}

pay_json_bytes = json.dumps(payment_data).encode('utf-8')
invoice_json_bytes = json.dumps(invoice_data).encode('utf-8')


# Helper function for encode + error handling
def encode(json_bytes: bytes, config: int) -> str:
    result_ptr = lib.bysquare_pay_encode(json_bytes, config)
    qr = ctypes.string_at(result_ptr).decode('utf-8')
    lib.bysquare_free(result_ptr)
    if qr.startswith("ERROR:"):
        print(f"Error: {qr[6:]}")
        sys.exit(1)
    return qr


def encode_invoice(json_bytes: bytes, config: int) -> str:
    result_ptr = lib.bysquare_invoice_encode(json_bytes, config)
    qr = ctypes.string_at(result_ptr).decode('utf-8')
    lib.bysquare_free(result_ptr)
    if qr.startswith("ERROR:"):
        print(f"Error: {qr[6:]}")
        sys.exit(1)
    return qr


# PAY: Default config (v1.2.0 + deburr + validate)
qr_default = encode(pay_json_bytes, BYSQUARE_CONFIG_DEFAULT)
print(f"PAY default config: {qr_default}")

# PAY: Custom config - version 1.1.0 with deburr only
qr_custom = encode(pay_json_bytes, BYSQUARE_DEBURR | BYSQUARE_VERSION_110)
print(f"PAY custom config:  {qr_custom}")

# PAY: Decode
result_ptr = lib.bysquare_pay_decode(qr_default.encode('utf-8'))
decoded_json = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

if decoded_json.startswith("ERROR:"):
    print(f"Error: {decoded_json[6:]}")
    sys.exit(1)

print(f"PAY decoded: {decoded_json}")

# Invoice: Encode with defaults (v1.0.0 + validate)
qr_invoice = encode_invoice(invoice_json_bytes, BYSQUARE_CONFIG_DEFAULT)
print(f"Invoice: {qr_invoice}")

# Invoice: Decode
result_ptr = lib.bysquare_invoice_decode(qr_invoice.encode('utf-8'))
decoded_invoice = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

if decoded_invoice.startswith("ERROR:"):
    print(f"Error: {decoded_invoice[6:]}")
    sys.exit(1)

print(f"Invoice decoded: {decoded_invoice}")

# Detect type of a QR string (0=PAY, 1=Invoice, -1=error)
pay_type = lib.bysquare_detect_type(qr_default.encode('utf-8'))
invoice_type = lib.bysquare_detect_type(qr_invoice.encode('utf-8'))
print(f"QR type (PAY): {pay_type}")
print(f"QR type (Invoice): {invoice_type}")


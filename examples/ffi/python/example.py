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
BYSQUARE_VERSION_110 = 1 << 24  # v1.1.0 = 0b00000001_00000000_00000000_00000000

# Define function signatures
lib.bysquare_encode.argtypes = [ctypes.c_char_p, ctypes.c_int]
lib.bysquare_encode.restype = ctypes.c_void_p
lib.bysquare_decode.argtypes = [ctypes.c_char_p]
lib.bysquare_decode.restype = ctypes.c_void_p
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

# Option 1: Use config=0 for automatic default (deburr + validate + v1.2.0)
result_ptr = lib.bysquare_encode(json.dumps(payment_data).encode('utf-8'), 0)
qr_auto = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

if qr_auto.startswith("ERROR:"):
    print(f"Error: {qr_auto[6:]}")  # Strip "ERROR:" prefix
    sys.exit(1)

print(f"Encoded (config=0, auto-default): {qr_auto}")

# Option 2: Custom config - version 1.1.0, no validation
custom_config = BYSQUARE_DEBURR | BYSQUARE_VERSION_110
result_ptr = lib.bysquare_encode(json.dumps(payment_data).encode('utf-8'), custom_config)
qr_custom = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

if qr_custom.startswith("ERROR:"):
    print(f"Error: {qr_custom[6:]}")
    sys.exit(1)

print(f"Encoded (v1.1.0, no validation): {qr_custom}")

# Decode
result_ptr = lib.bysquare_decode(qr_auto.encode('utf-8'))
decoded_json = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

if decoded_json.startswith("ERROR:"):
    print(f"Error: {decoded_json[6:]}")
    sys.exit(1)

print(f"Decoded: {decoded_json}")


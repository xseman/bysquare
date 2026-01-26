#!/usr/bin/env python3

import ctypes
import json
import sys

from pathlib import Path

lib_ext = "dylib" if sys.platform == "darwin" else "dll" if sys.platform == "win32" else "so"
lib_path = Path(__file__).parent.parent.parent.parent / "go" / "bin" / f"libbysquare.{lib_ext}"
lib = ctypes.CDLL(str(lib_path))

# Define function signatures
lib.bysquare_create_config.argtypes = []
lib.bysquare_create_config.restype = ctypes.c_size_t
lib.bysquare_config_set_deburr.argtypes = [ctypes.c_size_t, ctypes.c_int]
lib.bysquare_config_set_validate.argtypes = [ctypes.c_size_t, ctypes.c_int]
lib.bysquare_config_set_version.argtypes = [ctypes.c_size_t, ctypes.c_int]
lib.bysquare_encode.argtypes = [ctypes.c_char_p, ctypes.c_size_t]
lib.bysquare_encode.restype = ctypes.c_void_p
lib.bysquare_free_config.argtypes = [ctypes.c_size_t]
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

# Create config and set options
config = lib.bysquare_create_config()
lib.bysquare_config_set_deburr(config, 1)      # enable deburr
lib.bysquare_config_set_validate(config, 1)    # enable validation

# Encode
result_ptr = lib.bysquare_encode(json.dumps(payment_data).encode('utf-8'), config)
qr_string = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)
print(f"Encoded: {qr_string}")

# Decode
result_ptr = lib.bysquare_decode(qr_string.encode('utf-8'))
decoded_json = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)
print(f"Decoded: {decoded_json}")

# Cleanup
lib.bysquare_free_config(config)

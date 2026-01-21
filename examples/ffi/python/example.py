#!/usr/bin/env python3
import ctypes
import json
import sys
from pathlib import Path

lib_ext = "dylib" if sys.platform == "darwin" else "dll" if sys.platform == "win32" else "so"
lib_path = Path(__file__).parent.parent.parent.parent / "go" / "bin" / f"libbysquare.{lib_ext}"
lib = ctypes.CDLL(str(lib_path))

lib.bysquare_encode.argtypes = [ctypes.c_char_p]
lib.bysquare_encode.restype = ctypes.c_void_p
lib.bysquare_decode.argtypes = [ctypes.c_char_p]
lib.bysquare_decode.restype = ctypes.c_void_p
lib.bysquare_free.argtypes = [ctypes.c_void_p]
lib.bysquare_free.restype = None

data = {
    "payments": [{
        "type": 1,
        "amount": 123.45,
        "currencyCode": "EUR",
        "variableSymbol": "987654",
        "beneficiary": {"name": "John Doe"},
        "bankAccounts": [{"iban": "SK9611000000002918599669"}]
    }]
}

result_ptr = lib.bysquare_encode(json.dumps(data).encode('utf-8'))
qr = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

print(f"Encoded: {qr}")

result_ptr = lib.bysquare_decode(qr.encode('utf-8'))
decoded = ctypes.string_at(result_ptr).decode('utf-8')
lib.bysquare_free(result_ptr)

print(f"Decoded: {decoded}")

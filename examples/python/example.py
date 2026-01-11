#!/usr/bin/env python3
"""
Python example for using the bysquare C FFI library.

Requirements:
    - libbysquare.so (or .dylib on macOS, .dll on Windows)
    - Python 3.6+

Usage:
    python example.py
"""

import ctypes
import json
import sys
from pathlib import Path

# Determine library extension based on platform
if sys.platform == "darwin":
    lib_ext = "dylib"
elif sys.platform == "win32":
    lib_ext = "dll"
else:
    lib_ext = "so"

# Load the shared library
lib_path = Path(__file__).parent.parent.parent / "go" / "bin" / f"libbysquare.{lib_ext}"
lib = ctypes.CDLL(str(lib_path))

# Define function signatures
lib.bysquare_encode.argtypes = [ctypes.c_char_p]
lib.bysquare_encode.restype = ctypes.c_void_p

lib.bysquare_decode.argtypes = [ctypes.c_char_p]
lib.bysquare_decode.restype = ctypes.c_void_p

lib.bysquare_free.argtypes = [ctypes.c_void_p]
lib.bysquare_free.restype = None

lib.bysquare_version.argtypes = []
lib.bysquare_version.restype = ctypes.c_void_p


def encode_payment(payment_data: dict) -> str:
    """
    Encode payment data to BySquare QR string.
    
    Args:
        payment_data: Dictionary containing payment information
        
    Returns:
        QR code string or error message
    """
    json_data = json.dumps(payment_data).encode('utf-8')
    result_ptr = lib.bysquare_encode(json_data)
    if result_ptr:
        result = ctypes.string_at(result_ptr).decode('utf-8')
        lib.bysquare_free(result_ptr)
        return result
    return ""


def decode_qr(qr_string: str) -> dict:
    """
    Decode BySquare QR string to payment data.
    
    Args:
        qr_string: BySquare QR code string
        
    Returns:
        Dictionary containing payment information or error
    """
    qr_bytes = qr_string.encode('utf-8')
    result_ptr = lib.bysquare_decode(qr_bytes)
    if result_ptr:
        result = ctypes.string_at(result_ptr).decode('utf-8')
        lib.bysquare_free(result_ptr)
        return json.loads(result)
    return {}


def get_version() -> str:
    """Get library version."""
    version_ptr = lib.bysquare_version()
    if version_ptr:
        version = ctypes.string_at(version_ptr).decode('utf-8')
        lib.bysquare_free(version_ptr)
        return version
    return ""


def main():
    print(f"BySquare FFI Library Version: {get_version()}")
    print()

    # Example payment data
    payment_data = {
        "payments": [{
            "type": 1,
            "amount": 123.45,
            "currencyCode": "EUR",
            "variableSymbol": "987654",
            "bankAccounts": [
                {"iban": "SK9611000000002918599669"}
            ]
        }]
    }

    print("Payment Data:")
    print(json.dumps(payment_data, indent=4))
    print()

    # Encode
    qr_string = encode_payment(payment_data)
    print(f"Encoded QR String: {qr_string}")
    print()

    # Decode
    decoded_data = decode_qr(qr_string)
    print("Decoded Payment Data:")
    print(json.dumps(decoded_data, indent=4))


if __name__ == "__main__":
    main()

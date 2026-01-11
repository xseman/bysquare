#!/usr/bin/env bash

set -e

cd "$(dirname "${0}")" || exit 1

# Check if library exists in go/bin/
if [ ! -f "../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found in go/bin/." 
    echo "Run ../build.sh first."
    exit 1
fi

# Check if Swift is available
if ! command -v swiftc &> /dev/null; then
    echo "Error: swiftc not found. Please install Swift."
    exit 1
fi

echo "Compiling Swift example..."
swiftc Example.swift -o example

echo ""
echo "Running Swift FFI example..."
echo "============================"
export LD_LIBRARY_PATH=../../go/bin:$LD_LIBRARY_PATH
export DYLD_LIBRARY_PATH=../../go/bin:$DYLD_LIBRARY_PATH
./example

# Cleanup
rm -f example

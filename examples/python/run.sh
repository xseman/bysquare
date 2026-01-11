#!/usr/bin/env bash

set -e

cd "$(dirname "${0}")" || exit 1

# Check if library exists in go/bin/
if [ ! -f "../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found in go/bin/." 
    echo "Run ../build.sh first."
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 not found"
    exit 1
fi

echo "Running Python FFI example..."
echo "============================"
export LD_LIBRARY_PATH=../../go/bin:$LD_LIBRARY_PATH
python3 example.py

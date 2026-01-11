#!/usr/bin/env bash

set -e

cd "$(dirname "${0}")" || exit 1

# Check if library exists in go/bin/
if [ ! -f "../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found in go/bin/." 
    echo "Run ../build.sh first."
    exit 1
fi

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "Error: php not found"
    exit 1
fi

# Check if FFI extension is enabled
if ! php -m | grep -q FFI; then
    echo "Error: PHP FFI extension is not enabled"
fi

echo "Running PHP FFI example..."
echo "============================"
export LD_LIBRARY_PATH=../../go/bin:$LD_LIBRARY_PATH
php example.php

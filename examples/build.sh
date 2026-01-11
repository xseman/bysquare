#!/usr/bin/env bash

# Build the bysquare FFI library in go/bin/

set -e

cd "$(dirname "${0}")" || exit 1

echo "Building bysquare FFI library..."

./../go/scripts/build-ffi.sh

echo ""
echo "FFI library built in: bin/libbysquare.*"

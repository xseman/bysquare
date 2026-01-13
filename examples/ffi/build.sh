#!/usr/bin/env bash

# Build the bysquare FFI library in go/bin/

set -e

cd "$(dirname "${0}")" || exit 1

echo "Building bysquare FFI library..."

cd ../../go
make build-ffi

echo ""
echo "FFI library built in: bin/libbysquare.*"

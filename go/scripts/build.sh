#!/usr/bin/env bash

# Build CLI binary

set -e

cd "$(dirname "${0}")/.." || exit 1

echo "Building CLI binary..."
mkdir -p bin
go build -o bin/bysquare ./cmd/bysquare
ls -lh bin/bysquare

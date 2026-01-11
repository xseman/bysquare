#!/usr/bin/env bash

# Run tests with race detector

set -e

cd "$(dirname "${0}")/.." || exit 1

echo "Running tests..."

go test -v -race ./...

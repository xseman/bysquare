#!/usr/bin/env bash

# Run tests with coverage report

set -e

cd "$(dirname "${0}")/.." || exit 1

echo "Running tests with coverage..."
go test \
    -v \
    -race \
    -coverprofile=coverage.out \
    -covermode=atomic \
    ./...

echo ""
echo "Coverage summary:"
go tool cover -func=coverage.out | grep total

if command -v go &> /dev/null; then
    echo ""
    echo "Generating HTML coverage report..."
    go tool cover -html=coverage.out -o coverage.html
    ls -lh coverage.html coverage.out
fi

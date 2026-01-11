#!/usr/bin/env bash

# Build FFI shared library

set -e

cd "$(dirname "${0}")/.." || exit 1

PLATFORM="${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
OUTPUT_DIR="${2:-bin}"

echo "Building FFI library for ${PLATFORM}..."
mkdir -p "${OUTPUT_DIR}"

build_for_platform() {
    local os=$1
    local arch=$2
    local ext=$3
    
    echo "Building for ${os}/${arch}..."
    CGO_ENABLED=1 \
        GOOS=${os} \
        GOARCH=${arch} \
        go build \
        -buildmode=c-shared \
        -o "${OUTPUT_DIR}/libbysquare-${os}-${arch}${ext}" \
        ./cmd/libbysquare

    ls -lh "${OUTPUT_DIR}/libbysquare-${os}-${arch}${ext}"
}

case "${PLATFORM}" in
    linux)
        build_for_platform linux amd64 .so
        ;;
    darwin|macos)
        build_for_platform darwin amd64 .dylib
        build_for_platform darwin arm64 .dylib
        ;;
    windows)
        build_for_platform windows amd64 .dll
        ;;
    all)
        echo "Building for all platforms..."
        build_for_platform linux amd64 .so
        build_for_platform darwin amd64 .dylib
        build_for_platform darwin arm64 .dylib
        build_for_platform windows amd64 .dll
        ;;
    *)
        echo "Error: Unknown platform: ${PLATFORM}"
        echo "Usage: ${0} [linux|darwin|windows|all] [output-dir]"
        exit 1
        ;;
esac

#!/usr/bin/env bash

# Cross-compile for multiple platforms

set -e

cd "$(dirname "${0}")/.." || exit 1

OUTPUT_DIR="${1:-bin}"
LDFLAGS="${2:--s -w}"

echo "Cross-compiling for multiple platforms..."

mkdir -p "${OUTPUT_DIR}"

PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "darwin/amd64"
    "darwin/arm64"
    "windows/amd64"
    "windows/arm64"
)

for platform in "${PLATFORMS[@]}"; do
    IFS='/' read -r os arch <<< "$platform"
    output="${OUTPUT_DIR}/bysquare-${os}-${arch}"
    [ "${os}" = "windows" ] && output="${output}.exe"
    
    echo "Building for ${os}/${arch}..."
    CGO_ENABLED=0 \
        GOOS=${os} \
        GOARCH=${arch} \
        go build \
        -ldflags="${LDFLAGS}" \
        -o "${output}" \
        ./cmd/bysquare
done

ls -lh "${OUTPUT_DIR}"/bysquare-*

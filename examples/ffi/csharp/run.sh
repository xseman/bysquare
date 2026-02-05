#!/usr/bin/env bash

set -e

cd "$(dirname "${0}")" || exit 1

# Check if library exists in go/bin/
if [ ! -f "../../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found in go/bin."
    echo "Run ../../build.sh first."
    exit 1
fi

# Check if dotnet is available
if ! command -v dotnet &> /dev/null; then
    echo "Error: dotnet not found"
    echo "Install .NET SDK from https://dotnet.microsoft.com/download"
    exit 1
fi

echo "Running C# FFI example..."
echo "============================"
export LD_LIBRARY_PATH=../../../go/bin:$LD_LIBRARY_PATH
dotnet run

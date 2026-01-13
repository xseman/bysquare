#!/usr/bin/env bash
set -e
cd "$(dirname "${0}")" || exit 1

if [ ! -f "../../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found. Run ../build.sh first."
    exit 1
fi

if ! command -v javac &> /dev/null; then
    echo "Error: javac not found. Please install JDK 22+."
    exit 1
fi

echo "Compiling Java example..."
javac --enable-preview --release 21 Example.java

echo "Running Java FFI example..."
export LD_LIBRARY_PATH=../../../go/bin:$LD_LIBRARY_PATH
/usr/lib/jvm/java-21-openjdk/bin/java --enable-preview --enable-native-access=ALL-UNNAMED Example

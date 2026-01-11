#!/usr/bin/env bash

set -e

cd "$(dirname "${0}")" || exit 1

# Check if library exists in go/bin/
if [ ! -f "../../go/bin/libbysquare.so" ]; then
    echo "Error: libbysquare.so not found in go/bin/." 
    echo "Run ../build.sh first."
    exit 1
fi

# Check if Java is available
if ! command -v javac &> /dev/null; then
    echo "Error: javac not found. Please install JDK."
    exit 1
fi

# Download dependencies if not present
if [ ! -f "jna.jar" ]; then
    echo "Downloading JNA..."
    curl -L -o jna.jar https://repo1.maven.org/maven2/net/java/dev/jna/jna/5.13.0/jna-5.13.0.jar
fi

if [ ! -f "gson.jar" ]; then
    echo "Downloading Gson..."
    curl -L -o gson.jar https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar
fi

echo "Compiling Java example..."
javac -cp .:gson.jar:jna.jar Example.java

echo ""
echo "Running Java FFI example..."
echo "============================"
java -Djna.library.path=../../go/bin --enable-native-access=ALL-UNNAMED -cp .:gson.jar:jna.jar Example

#!/bin/sh

cd "$(dirname "${0}")" || exit 1

../../go/bin/bysquare encode example.json | npx qrcode-terminal

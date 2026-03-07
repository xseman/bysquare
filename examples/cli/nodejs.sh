#!/bin/sh

cd "$(dirname "${0}")" || exit 1

npx bysquare pay encode example.json | npx qrcode-terminal

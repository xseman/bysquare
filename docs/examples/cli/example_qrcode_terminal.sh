#!/bin/sh

cd "$(dirname $0)" || exit 1

bysquare --encode example.json | npx qrcode-terminal

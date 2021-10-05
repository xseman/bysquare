#!/bin/sh

cd "$(dirname $0)" || exit 1

bysquare example.json | npx qrcode-terminal

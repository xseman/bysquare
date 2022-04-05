#!/bin/bash

for cmd in {drawio,}; do
    if ! command -v "${cmd}" >/dev/null; then
        echo >&2 "This script requires '${cmd}' to be installed."
        exit 1
    fi
done

cd "$(dirname "${0}")" || exit 1

for uml in *.drawio; do
    NAME=${uml%%.*}
    drawio -x -f svg -o "${NAME}.svg" "${uml}"
done

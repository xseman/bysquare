#!/bin/bash

chmod +x ./lib/{cjs,mjs}/cli.js
cp package.json ./lib/mjs/
jq '.type="commonjs"' package.json > ./lib/cjs/package.json
git commit -am "feat: build artefacts"

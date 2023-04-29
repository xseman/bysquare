#!/bin/bash

chmod +x ./lib/{cjs,mjs}/cli.js
cp package.json ./lib/mjs/
cd ./lib/cjs && npm pkg set type="commonjs"
git commit -am "feat: build artefacts"

SHELL=/bin/bash

all:
	install test

install:
	npm ci

clean:
	rm -rf ./node_modules

test:
	npm test

prebuild:
	rm -rf ./lib || :

build:
	npx tsc --outDir ./lib/esm/
	npx tsc --module CommonJS --moduleResolution Node --outDir ./lib/cjs/

postbuild:
	chmod +x ./lib/{cjs,esm}/cli.js
	echo '{ "type": "commonjs" }' > ./lib/cjs/package.json
	echo '{ "type": "module" }' > ./lib/esm/package.json
	git commit -am "build: artefacts"

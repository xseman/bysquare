# Changelog

## [3.0.0](https://github.com/xseman/bysquare/compare/v2.8.2...v3.0.0) (2024-05-22)


### ⚠ BREAKING CHANGES

* simplify generate logic and input data model

### Features

* add cjs support ([3527856](https://github.com/xseman/bysquare/commit/3527856796d0f895c3ee410d86ae36cce3b00f70))
* build artefacts ([ef2c2f0](https://github.com/xseman/bysquare/commit/ef2c2f0c70953271e91ccb97494331b1d9fc36c7))
* build artefacts ([ac25cf1](https://github.com/xseman/bysquare/commit/ac25cf1ca8246262b8fbf8b1f95280cef681a442))
* build artefacts ([d4150f3](https://github.com/xseman/bysquare/commit/d4150f36cb2992ed2c54c26c52cdbe93dc38fe34))
* build artefacts ([7b56440](https://github.com/xseman/bysquare/commit/7b564408bc569ea3d1b20182ca9f71e6f4f7c7e3))
* **build:** npm installable artifacts ([3ae703a](https://github.com/xseman/bysquare/commit/3ae703a342b49736e5b1faac6aaf8f0f72984601))
* **build:** npm installable artifacts ([8a7964d](https://github.com/xseman/bysquare/commit/8a7964da28d60e4109b4c463681e2a5227c2f84f))
* **ci:** add node 19 ([d96c95b](https://github.com/xseman/bysquare/commit/d96c95bcd4fbb9bdaa1f790bbb89a2263f657005))
* **cli:** encode jsonl ([6694495](https://github.com/xseman/bysquare/commit/669449522634659920f1811e6f731db0a695e163))
* **cli:** encode multiple files ([d70b611](https://github.com/xseman/bysquare/commit/d70b611c8e0a01dc3cd5b0a3783fe3b2b30ed54d))
* deno testing with example ([3bd695a](https://github.com/xseman/bysquare/commit/3bd695a2b66c7f47c44e5f28dc72f4db17e220dc))
* drop c++ dependency, drop Buffer for Uint8Array to make future web/deno compatibility ([823cb64](https://github.com/xseman/bysquare/commit/823cb64c5903ff5abc7542b533a47f15a2b134a0))
* dynamicly calculate lzma dictionary, other improvements ([3b3df85](https://github.com/xseman/bysquare/commit/3b3df85e4f2d2251820ce5e6412de501d927d7b7))
* **examples:** add github install for testing ([adf3e3b](https://github.com/xseman/bysquare/commit/adf3e3bbd9a3d00d552fbde6e23b24127fe7ff05))
* **examples:** add github install for testing ([007aae1](https://github.com/xseman/bysquare/commit/007aae149f5102e8ea223cda25f095188d6e08b4))
* **examples:** update web ([dceea0c](https://github.com/xseman/bysquare/commit/dceea0c1bd13791e154967360fce6f01e25bc72c))
* **examples:** update web ([ffcb5d5](https://github.com/xseman/bysquare/commit/ffcb5d5905ce96cf2bdec04d08c13d988a3a0dc8))
* **generate:** simplify logic and input data model ([0930612](https://github.com/xseman/bysquare/commit/093061227d54341a7118c490a6fe6f7a46228ddb))
* github as install source, keep artifacts ([63a691e](https://github.com/xseman/bysquare/commit/63a691e90fa8aa6c8ced5f7ef712c85162340d29))
* github as install source, keep artifacts ([3387ae0](https://github.com/xseman/bysquare/commit/3387ae0e63273d81fdcd82b152afe5f3b6c7ec3a))
* migrate to esm, simplify tests with xv ([57511d4](https://github.com/xseman/bysquare/commit/57511d44a2527646ae85ad7c70a2e38fec3c0312))
* migrate to esm, simplify tests with xv ([8f703f3](https://github.com/xseman/bysquare/commit/8f703f31a38d52e8f186318c5048afad23dd6cef))
* more consistent naming ([cf841d6](https://github.com/xseman/bysquare/commit/cf841d621e6245b70f545d57a504f4515debd4e9))
* **package:** update lzma dependency, other improvements ([29a6304](https://github.com/xseman/bysquare/commit/29a6304eb159982dc783b09a071c4903a88491d8))
* Parsing logic ([ef68f9b](https://github.com/xseman/bysquare/commit/ef68f9b295f08ff5467ad00a62e4d693fca89ee7))
* simplify generate logic and input data model ([08e33f6](https://github.com/xseman/bysquare/commit/08e33f6e3e8bcb52f2fbec8007ff1d3aa807f366))
* update examples ([9d92b85](https://github.com/xseman/bysquare/commit/9d92b85b0698656ceed9dd6c804fc63d05906d0e))
* update examples ([eee8487](https://github.com/xseman/bysquare/commit/eee8487f47bd7321f665ca5fe51684623250ee69))


### Bug Fixes

* check lzma decompression type ([8ae6df1](https://github.com/xseman/bysquare/commit/8ae6df173c23ca52577b818af1620a9489d80ee7))
* deburr latin-1 letters to basic letters ([b8f3905](https://github.com/xseman/bysquare/commit/b8f3905d58da66781af2c8ff2cc4704ab34ad91b))
* default export ([4e56a8b](https://github.com/xseman/bysquare/commit/4e56a8bc35dbb9a0eaf97a02fd7962d753002e66))
* export new functions naming ([e945b3a](https://github.com/xseman/bysquare/commit/e945b3a188c76cf75fba1d4b64c7b72402299b1e))
* inlined enums in emited js ([c53101d](https://github.com/xseman/bysquare/commit/c53101d0faa02d1899f42ce9dcdbe6eff907a2f4))
* **lzma:** downgrade dependency for ARM M1 ([e7dba4b](https://github.com/xseman/bysquare/commit/e7dba4be5ea105603538901b511022fe01be4c80))
* Typo ([1bb99ef](https://github.com/xseman/bysquare/commit/1bb99ef776d5b264374a07ffcb0219beff90f8f5))


### Dependency updates

* remove unused types ([0d5735b](https://github.com/xseman/bysquare/commit/0d5735b4827db823f74b415fb3d36de40d22cf81))
* update dprint ([3fb4cc4](https://github.com/xseman/bysquare/commit/3fb4cc427acdbac9b556d494cadf17f9fda703de))


### Documentation

* add lit example ([8dbdec7](https://github.com/xseman/bysquare/commit/8dbdec761a57a22d60a1f2bceb9078c4172ed886))
* add static pages navigation ([d073df9](https://github.com/xseman/bysquare/commit/d073df964ea33363c35694f09db80014fc5d6af8))
* cleanup ([c1a2a2f](https://github.com/xseman/bysquare/commit/c1a2a2fb1e8e4188388856dbdba75e6d51a8207d))
* cleanup ([47843a0](https://github.com/xseman/bysquare/commit/47843a041e9d97c45b4cf4321d1837fa65aa25e6))
* cleanup ([ea1d88c](https://github.com/xseman/bysquare/commit/ea1d88c784de17be8be79af0658d4b7095d3353a))
* cleanup ([81fd4f8](https://github.com/xseman/bysquare/commit/81fd4f853382b523f1a048f10dd4d0607fe7b87e))
* cleanup web examples ([6d7c556](https://github.com/xseman/bysquare/commit/6d7c556d08bcb53781090d131679825af277f5ee))
* esm info ([a574bdd](https://github.com/xseman/bysquare/commit/a574bdd11c9c1bdb60f659d34c1b6832cf9e13a5))
* mention nodejs support & cleanup ([bcd06b5](https://github.com/xseman/bysquare/commit/bcd06b5af6d59a2de500ebf703cfd204c1633f76))
* platform support ([9d1bda9](https://github.com/xseman/bysquare/commit/9d1bda942f5f86b0fdcc75ef1b01451869e7fa4f))
* README ([7734f61](https://github.com/xseman/bysquare/commit/7734f61576c762b7997b6094eabcaae96ccc68aa))
* readme improvements, formatting ([0db5351](https://github.com/xseman/bysquare/commit/0db5351e00bd35115b196b0d9e6b139cec52d3c3))
* rename folder, add xsd spec ([f12eb8f](https://github.com/xseman/bysquare/commit/f12eb8f594ce9c6eeeb8236cd11bdd785a60d702))
* update ([28173ec](https://github.com/xseman/bysquare/commit/28173ecf596cf1393c51284df762d0ec631172c0))
* update ([1087609](https://github.com/xseman/bysquare/commit/1087609fc89f2c7eee7e1b162a94a61eec32bd08))
* update API ([5decaac](https://github.com/xseman/bysquare/commit/5decaac3e6734ac365f431eacf0a95d305d1d4b7))
* update imports ([2027e9f](https://github.com/xseman/bysquare/commit/2027e9fadf4dac5b7548914e18d0cbfb8ab9a3ee))
* update lit example ([3fdea52](https://github.com/xseman/bysquare/commit/3fdea52c9f20e1596787f4db0b24471703b2ecf6))
* update logic, add lzma header ([d51d163](https://github.com/xseman/bysquare/commit/d51d163fd57b043b144c33ff982413d4b20b54bc))
* update readme ([6dca914](https://github.com/xseman/bysquare/commit/6dca91454b82a99dee60910fbcb1c4ae70424eb4))
* update uml ([c50f83b](https://github.com/xseman/bysquare/commit/c50f83b5666557903411523c6c8cbe4a988eea35))
* update web examples ([f43f894](https://github.com/xseman/bysquare/commit/f43f8946a2b84841341e59f216d80987a3327bd1))


### Maintenance

* add manual release ([85517f4](https://github.com/xseman/bysquare/commit/85517f49b7847b39d653f7b953127bfb2acb0c80))
* add windows, mac, node v18 ([9474156](https://github.com/xseman/bysquare/commit/947415613307342df9beeafc17e6de0026ccd830))
* apply formatting ([97440b6](https://github.com/xseman/bysquare/commit/97440b67c84edac679e4f59de928f16be9468890))
* artefacts version bump ([1732d77](https://github.com/xseman/bysquare/commit/1732d77b799bdbc72499def6c3073e25a4bbb8a5))
* build artifacts ([d2cb853](https://github.com/xseman/bysquare/commit/d2cb853d1126d5ca9458c13bfa0b5ba021c25996))
* bump version ([3d6b252](https://github.com/xseman/bysquare/commit/3d6b252d6b18e24e625ae5ddb48ad26e17f22640))
* **CI:** update config ([ba370cc](https://github.com/xseman/bysquare/commit/ba370cca4129a06199349219882832b83ae13404))
* **CI:** update config ([933e6f1](https://github.com/xseman/bysquare/commit/933e6f196d9330763e5a8acf33acc413e6a24b71))
* **ci:** update inactive issues ([d5a2676](https://github.com/xseman/bysquare/commit/d5a267634602e389c815f57d04804fad65ef9300))
* cleanup ([38234c6](https://github.com/xseman/bysquare/commit/38234c649aef965cdae8e6f097bdc373d3b79c01))
* cleanup docs ([78cc5b1](https://github.com/xseman/bysquare/commit/78cc5b143cab7b31a705dd6c616c1ccc0c4a2eba))
* cleanup package.json ([b6b379a](https://github.com/xseman/bysquare/commit/b6b379af229064dd6f2a1d1893a238dbcca32810))
* cleanup release ([5abc03b](https://github.com/xseman/bysquare/commit/5abc03b97d6aeeae778df0afb8181557eade1901))
* **deps:** update node types ([a7cea81](https://github.com/xseman/bysquare/commit/a7cea81f38449c79ead92ab5ed6b4b85cdacb484))
* **deps:** update release ([4698324](https://github.com/xseman/bysquare/commit/469832474eb558af755e9b583ef101e1e2ebf0be))
* **deps:** update typescript, switch tsx for ts-node ([d7dca11](https://github.com/xseman/bysquare/commit/d7dca11ace5e49aac61b53da58094cd9856e7476))
* **deps:** upgrade & format ([333db4f](https://github.com/xseman/bysquare/commit/333db4f09e9bc06dfa8a3e5ce06acdef9390c54e))
* **fix:** message variable, exempt label ([c27fc7d](https://github.com/xseman/bysquare/commit/c27fc7db89d0e2ebdab2ee08c2c430bb22f0ddb2))
* **master:** release 2.7.0 ([#11](https://github.com/xseman/bysquare/issues/11)) ([f278fe0](https://github.com/xseman/bysquare/commit/f278fe087aa4e1e0f4b0d4a1a55c6cfa93c26705))
* **master:** release 2.7.1 ([#12](https://github.com/xseman/bysquare/issues/12)) ([78f85cd](https://github.com/xseman/bysquare/commit/78f85cdf8c12dafac980cd6a82d9276ddd913455))
* move interface to types ([7d8a793](https://github.com/xseman/bysquare/commit/7d8a793460065b7a6e643e429c4a029e77166b25))
* move scripts to Makefile ([8354a74](https://github.com/xseman/bysquare/commit/8354a7407903972102164b1e1615f5c4613175db))
* **npm:** update scripts ([f376087](https://github.com/xseman/bysquare/commit/f376087f16cd6396a48f749508d4b252b153208c))
* package-lock v3 ([1aa176b](https://github.com/xseman/bysquare/commit/1aa176bd336c5e76bd72c8b9ec641a5624e9e9be))
* **package:** update lzma1 ([8462df6](https://github.com/xseman/bysquare/commit/8462df6c5687c6900fcc8ed4d150e159232d5ae0))
* **package:** upgrades ([f1c5472](https://github.com/xseman/bysquare/commit/f1c547225b9b0f3a6edf90b16eed7205bdde0059))
* **package:** upgrades ([2106660](https://github.com/xseman/bysquare/commit/2106660cb03e649d1fff51377eef17594880b72c))
* **readme:** add browser import ([88a106b](https://github.com/xseman/bysquare/commit/88a106b53cb54fcac44cacc270c04e6a417fb726))
* remove npmrc ([26ba4e3](https://github.com/xseman/bysquare/commit/26ba4e33a7feba764de77f44e2ade224e7b78e91))
* remove todo ([ade0b17](https://github.com/xseman/bysquare/commit/ade0b171293954d3813787914cdcd70af05d3e93))
* rollback release-action ([08e811a](https://github.com/xseman/bysquare/commit/08e811ac2b04ad763df4055fea41a80a0ace8949))
* static page deploy ([2d87c70](https://github.com/xseman/bysquare/commit/2d87c70b4fa2fda83b7c7a2f5c186153a4c3e965))
* **test:** add release workflow ([acf4195](https://github.com/xseman/bysquare/commit/acf4195d20e11e0ba17ea075201a76fd1584fed8))
* update CI ([2dadc15](https://github.com/xseman/bysquare/commit/2dadc15aee512e7a9dd52adc955108b03bda7f1b))
* update configs ([55af265](https://github.com/xseman/bysquare/commit/55af26597bc6a632424170fb081cbd683c17da31))
* update configs ([614d6c0](https://github.com/xseman/bysquare/commit/614d6c00b3d2fcb5a2743d2134554e389463e09d))
* update configs & formatting ([77a898a](https://github.com/xseman/bysquare/commit/77a898a75bb62fa1cf973af604f16576566cece5))
* update deps ([82513a1](https://github.com/xseman/bysquare/commit/82513a1439dfe2f832f24dd6a0999d07b9092df9))
* update examples ([a6cd424](https://github.com/xseman/bysquare/commit/a6cd424da50e61a053e78f7899366e6ddb0d6c95))
* update examples ([d7162df](https://github.com/xseman/bysquare/commit/d7162df17a749d99629e7bf1f5742f8ed952285a))
* update examples ([de6225c](https://github.com/xseman/bysquare/commit/de6225c3715571ce06721bacc19726736ae25703))
* update install step ([58479e1](https://github.com/xseman/bysquare/commit/58479e10de2eef94a1a68cc5438330e12a3603a4))
* update npm scripts, tsc build output ([676a9d1](https://github.com/xseman/bysquare/commit/676a9d15bbe0f2a8bc3f22ac478c41d13c5269ad))
* update package scripts ([e46c4a4](https://github.com/xseman/bysquare/commit/e46c4a4eaf812c2c383ca993cd7b9b41e235e307))
* update readme ([ec68879](https://github.com/xseman/bysquare/commit/ec688792d2494599933e3265802dce7b48dacf70))
* update release config ([89afdbc](https://github.com/xseman/bysquare/commit/89afdbc13bcddedc383f19a2f91b33eee0808d62))
* update release sections ([a6c6608](https://github.com/xseman/bysquare/commit/a6c6608e90251c1c3194cf0f5362af0a3e0d5734))
* update release workflow ([5699c40](https://github.com/xseman/bysquare/commit/5699c4014baca00200434664fc7f114f9eba04f9))
* update release workflow ([e955661](https://github.com/xseman/bysquare/commit/e9556611b0a6ab244f16cc0c7e108b2493ae3754))
* update release workflow ([af27b2e](https://github.com/xseman/bysquare/commit/af27b2ecfdd055d9adcd7218ea8969363d9349f8))
* update scripts ([e70836f](https://github.com/xseman/bysquare/commit/e70836f82ac50e5c5123aa608419e720430886b5))
* update scripts ([9c07a60](https://github.com/xseman/bysquare/commit/9c07a60e692eab0eedc7e66e8b038c5f20091486))
* update scripts ([e72c11a](https://github.com/xseman/bysquare/commit/e72c11a3d035a1bc892c4294af58f1cb85c1b944))
* update structure ([c7e52c7](https://github.com/xseman/bysquare/commit/c7e52c7234a9af3cbc33420de526663a25693df2))
* update tsconfig ([1167cca](https://github.com/xseman/bysquare/commit/1167ccaeb8277b2e6db0d230644a09737f25c96a))
* update vscode config ([9e9ba4a](https://github.com/xseman/bysquare/commit/9e9ba4a1da801e5250c58175e4a105e46f5a7c51))
* update vscode recommendation ([a50a06d](https://github.com/xseman/bysquare/commit/a50a06d11229528a4db841fd255f56b842027149))
* update vscode settings ([32bd6fd](https://github.com/xseman/bysquare/commit/32bd6fdad4ed04e9e7cf51344fa7e666a544f905))
* update web example ([9a6b8aa](https://github.com/xseman/bysquare/commit/9a6b8aaeeeb9f1b5d785db0bf7361cd5f0e29135))
* upgrades ([5a6d315](https://github.com/xseman/bysquare/commit/5a6d3159087df42c4152cff1c8de5498d9bcff7f))
* upgrades ([e4413bc](https://github.com/xseman/bysquare/commit/e4413bc17de26d73fb17aa993f2b793d29211457))
* upgrades, update lockfile version ([4176f21](https://github.com/xseman/bysquare/commit/4176f21c5d187db66b2f376c58d7dde68e6e35fb))
* windows rm exit code problem ([237c20c](https://github.com/xseman/bysquare/commit/237c20c046d504b2299635c55ab0b1a7c361928f))


### Refactors

* add src folder, other small changes ([494956a](https://github.com/xseman/bysquare/commit/494956adeb6a28056f80dd505e6f9955b0caf485))
* decode ([1e440ea](https://github.com/xseman/bysquare/commit/1e440eadeb4ea1066926cb119d734d69ae0b5dbc))
* **docs:** dir name ([cd26c90](https://github.com/xseman/bysquare/commit/cd26c90c7fd4d91b3f5cc3b44359d23ebd0288ee))
* examples ([4221f6c](https://github.com/xseman/bysquare/commit/4221f6c41e13fec3bf9ee1cc4955e23dd8b9bb03))
* **examples:** dir name ([101c7a9](https://github.com/xseman/bysquare/commit/101c7a946d31c7dd5e58beab1f9aa13d8fc83196))
* **examples:** dir name ([c509736](https://github.com/xseman/bysquare/commit/c509736274105e5837f05ce613fadc714591a382))
* **example:** update model and package ([9776de4](https://github.com/xseman/bysquare/commit/9776de435098d4d21ca6e931fe0819912b6e9391))
* express example to typescript ([95c35f1](https://github.com/xseman/bysquare/commit/95c35f105d373ccb75b6855082eb7230e7833a4d))
* folder naming ([c97c863](https://github.com/xseman/bysquare/commit/c97c8636bf919af3432da415caab4dd4278967e2))
* folder naming ([7538a19](https://github.com/xseman/bysquare/commit/7538a19d07e30491d2b88c49da32a218cf88a05f))
* **generate:** add options, move up deburr logic ([ceb1ad8](https://github.com/xseman/bysquare/commit/ceb1ad8642f6ae1c2b8e24f227d3f179db417179))
* **generate:** add options, move up deburr logic ([8d3e511](https://github.com/xseman/bysquare/commit/8d3e511bb5b59d36d2105c366a2063f02e084505))
* move constant ([a49b807](https://github.com/xseman/bysquare/commit/a49b807253db90b380c8e3076db760e77d71bff8))
* move examples to docs ([9be876f](https://github.com/xseman/bysquare/commit/9be876f7f961e4691f27a13be3f566f23a4a9365))
* move uml to docs ([997514b](https://github.com/xseman/bysquare/commit/997514ba714f7768d2b48791b959900ae83806f1))
* naming, simplify parse header ([23997b5](https://github.com/xseman/bysquare/commit/23997b54e7ebed05ee5bf1d21b1494c92c37de96))
* **package:** removes the internal implementation of rfc4648 ([78ca7c9](https://github.com/xseman/bysquare/commit/78ca7c9a5ee6be010f39e811fba628725fcdac54))
* **package:** removes the internal implementation of rfc4648 ([d5e9af3](https://github.com/xseman/bysquare/commit/d5e9af3d6bef87367dfa2e56ecb665f1c9299a86))
* remove github artefacts, simplify deploy ([17e76bb](https://github.com/xseman/bysquare/commit/17e76bb674ff9399cdfaa47d550def0097da0367))
* simplify logic, make more readable ([29b764f](https://github.com/xseman/bysquare/commit/29b764fc8f6e599bffad9be86ef6bf8c8d3065d5))
* simplify parse and generate logic, other improvements ([1589aa9](https://github.com/xseman/bysquare/commit/1589aa91fc5ae8ca95c59d9fa05d3999c1133200))
* simplify, apply styles, disable checksum validation ([5d5f0b9](https://github.com/xseman/bysquare/commit/5d5f0b9e0dd5c05baf104d787996aea6c33d1959))
* split functionality, add vitest ([31b6968](https://github.com/xseman/bysquare/commit/31b6968b213d6b9b57832d57c345d41e887160f7))
* tests ([68d77a7](https://github.com/xseman/bysquare/commit/68d77a76cbd0bf334b25ca861e56165bddc6968f))
* update logic and types ([363d8cb](https://github.com/xseman/bysquare/commit/363d8cba55fb058bf08ed08d2b57033b034001b7))


### Code Style

* add dprint, apply formatting ([2a34c52](https://github.com/xseman/bysquare/commit/2a34c52a7881bcba943f74fc944624f535c17a95))
* apply fmt ([a09641d](https://github.com/xseman/bysquare/commit/a09641d0343328c4dee16ce7a776d4660ae6dab9))
* enable semiColons ([1912425](https://github.com/xseman/bysquare/commit/191242569b7596ff4cc9aa5ee1ab0f1c75cec07d))
* update config ([e734eaf](https://github.com/xseman/bysquare/commit/e734eaf1fadc21f79726205f9a64a1139c3f5469))
* update readme ([c4780e6](https://github.com/xseman/bysquare/commit/c4780e69bde05f18047be9afe0b4ccbdf6cac081))


### Tests

* add parsing multiple dataset ([6904c38](https://github.com/xseman/bysquare/commit/6904c386db04434897a69dfbb6c0f788b1b94b0d))
* drop xv, use native runner ([8a9165c](https://github.com/xseman/bysquare/commit/8a9165c87741850b5bb5f1f10dd8b58f2443a1f6))


### Examples

* bump version, update model ([88485be](https://github.com/xseman/bysquare/commit/88485beb67cb8bcaf806adee432d11558cfdd0bc))
* bump version, update model ([86d7bf2](https://github.com/xseman/bysquare/commit/86d7bf211378a8f324c1dc0357966e8e7a7bbf2d))
* cleanup, bump version ([47b62bb](https://github.com/xseman/bysquare/commit/47b62bbdf1b7c92d70c9ee783a1b20d69340df21))
* update package, apply formatting ([3a79a43](https://github.com/xseman/bysquare/commit/3a79a43ed685ab3f7f6fe2ac468ae56f5de12482))

## [2.8.2](https://github.com/xseman/bysquare/compare/v2.8.1...v2.8.2) (2024-03-19)


### Bug Fixes

* inlined enums in emited js ([c53101d](https://github.com/xseman/bysquare/commit/c53101d0faa02d1899f42ce9dcdbe6eff907a2f4))


### Maintenance

* update release sections ([a6c6608](https://github.com/xseman/bysquare/commit/a6c6608e90251c1c3194cf0f5362af0a3e0d5734))

## [2.8.1](https://github.com/xseman/bysquare/compare/v2.8.0...v2.8.1) (2024-03-16)


### Documentation

* cleanup ([c1a2a2f](https://github.com/xseman/bysquare/commit/c1a2a2fb1e8e4188388856dbdba75e6d51a8207d))
* mention nodejs support & cleanup ([bcd06b5](https://github.com/xseman/bysquare/commit/bcd06b5af6d59a2de500ebf703cfd204c1633f76))
* platform support ([9d1bda9](https://github.com/xseman/bysquare/commit/9d1bda942f5f86b0fdcc75ef1b01451869e7fa4f))


### Maintenance

* **ci:** update inactive issues ([d5a2676](https://github.com/xseman/bysquare/commit/d5a267634602e389c815f57d04804fad65ef9300))
* **deps:** update node types ([a7cea81](https://github.com/xseman/bysquare/commit/a7cea81f38449c79ead92ab5ed6b4b85cdacb484))
* **deps:** update release ([4698324](https://github.com/xseman/bysquare/commit/469832474eb558af755e9b583ef101e1e2ebf0be))
* **deps:** update typescript, switch tsx for ts-node ([d7dca11](https://github.com/xseman/bysquare/commit/d7dca11ace5e49aac61b53da58094cd9856e7476))
* **fix:** message variable, exempt label ([c27fc7d](https://github.com/xseman/bysquare/commit/c27fc7db89d0e2ebdab2ee08c2c430bb22f0ddb2))
* update configs ([614d6c0](https://github.com/xseman/bysquare/commit/614d6c00b3d2fcb5a2743d2134554e389463e09d))
* update configs & formatting ([77a898a](https://github.com/xseman/bysquare/commit/77a898a75bb62fa1cf973af604f16576566cece5))
* update deps ([82513a1](https://github.com/xseman/bysquare/commit/82513a1439dfe2f832f24dd6a0999d07b9092df9))
* update tsconfig ([1167cca](https://github.com/xseman/bysquare/commit/1167ccaeb8277b2e6db0d230644a09737f25c96a))


### Refactors

* tests ([68d77a7](https://github.com/xseman/bysquare/commit/68d77a76cbd0bf334b25ca861e56165bddc6968f))


### Styles

* apply fmt ([a09641d](https://github.com/xseman/bysquare/commit/a09641d0343328c4dee16ce7a776d4660ae6dab9))

## [2.8.0](https://github.com/xseman/bysquare/compare/v2.7.0...v2.8.0) (2023-10-23)


### Features

* **cli:** encode jsonl ([6694495](https://github.com/xseman/bysquare/commit/669449522634659920f1811e6f731db0a695e163))
* **cli:** encode multiple files ([d70b611](https://github.com/xseman/bysquare/commit/d70b611c8e0a01dc3cd5b0a3783fe3b2b30ed54d))


### Bug Fixes

* export new functions naming ([e945b3a](https://github.com/xseman/bysquare/commit/e945b3a188c76cf75fba1d4b64c7b72402299b1e))

## [2.7.1](https://github.com/xseman/bysquare/compare/v2.7.0...v2.7.1) (2023-10-21)


### Bug Fixes

* export new functions naming ([e945b3a](https://github.com/xseman/bysquare/commit/e945b3a188c76cf75fba1d4b64c7b72402299b1e))

## [2.7.0](https://github.com/xseman/bysquare/compare/v2.6.0...v2.7.0) (2023-10-21)


### Features

* more consistent naming ([cf841d6](https://github.com/xseman/bysquare/commit/cf841d621e6245b70f545d57a504f4515debd4e9))

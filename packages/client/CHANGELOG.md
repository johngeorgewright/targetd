# Changelog

## [7.0.1](https://github.com/johngeorgewright/targetd/compare/@targetd/client-v7.0.0...@targetd/client-v7.0.1) (2026-02-13)


### Bug Fixes

* **docs:** add comprehensive documentation and examples for Data API and targeting descriptors ([86545e9](https://github.com/johngeorgewright/targetd/commit/86545e96052bfeb67e281521b28dd33e9631fa65))

## [7.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/client-vv6.0.1...@targetd/client-vv7.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.
* Data generics have changed.
* moving to jsr deployments
* DataParser --> PayloadParser
* `useDataParser` and `userDataParsers` have been combined in to `useData`
* Anything called "validator" is now a "parser"

### Features

* add ability to use multi targets ([1042c20](https://github.com/johngeorgewright/targetd/commit/1042c201a397f0354fca08ff06c17efa6529111f))
* **client:** allow objects in query ([b704e42](https://github.com/johngeorgewright/targetd/commit/b704e424e0fa6dae9352ca9acb1d07570ec4664b))
* converting everything to deno ([bf3b252](https://github.com/johngeorgewright/targetd/commit/bf3b25262c8c4c0a2522bdf663744b5386c49180))


### Bug Fixes

* **deps:** update dependency express to v4.18.3 ([0a56fe9](https://github.com/johngeorgewright/targetd/commit/0a56fe9e09cdaa5b6cb98e9f30f12716aae162b8))
* **deps:** update dependency tslib to v2.6.3 ([798c7a6](https://github.com/johngeorgewright/targetd/commit/798c7a69df162c0d977fb65b680d83c95323fd42))
* **deps:** update dependency tslib to v2.7.0 ([95de94e](https://github.com/johngeorgewright/targetd/commit/95de94e43166bf40b8c3bd30407b80de2733741d))
* ensure workspace deps ([3fdd0ed](https://github.com/johngeorgewright/targetd/commit/3fdd0ed194009e22d82ed179b4b5bf9443eb7ffb))
* types ([d80cbba](https://github.com/johngeorgewright/targetd/commit/d80cbbaae80adac83486370b07b0a7e8445d5bd5))


### Performance Improvements

* reference required zod exports ([87bb323](https://github.com/johngeorgewright/targetd/commit/87bb323232899164cda2c873f8181cf323007c8f))


### Code Refactoring

* meta data typing ([a8d1d17](https://github.com/johngeorgewright/targetd/commit/a8d1d17b23c6e5321e5701489ca40ec6be6b8146))
* meta data typing ([abe3f25](https://github.com/johngeorgewright/targetd/commit/abe3f255b11075bd2b2b575de71df3e3deaa598c))
* rename dataparser to payloadparser ([52cd705](https://github.com/johngeorgewright/targetd/commit/52cd70579ddffba588bbb8b86029e2cc30441818))
* rename validators to parsers ([99c1014](https://github.com/johngeorgewright/targetd/commit/99c10142a0c716eb2c4a148a0f3561b85f222bc1))
* shortner api method names ([eb7c900](https://github.com/johngeorgewright/targetd/commit/eb7c9003c747c80236ec07d912850c8700eff350))

# Changelog

## [9.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/server-v8.0.0...@targetd/server-v9.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.
* moving to jsr deployments
* **server:** options as an object
* DataParser --> PayloadParser
* `useDataParser` and `userDataParsers` have been combined in to `useData`
* Anything called "validator" is now a "parser"

### Features

* converting everything to deno ([bf3b252](https://github.com/johngeorgewright/targetd/commit/bf3b25262c8c4c0a2522bdf663744b5386c49180))
* **server:** add ability to pass in express app ([df083f3](https://github.com/johngeorgewright/targetd/commit/df083f300588565ae05ee2e6655698a99ac10b68))
* **server:** cast array properties ([35fb5e0](https://github.com/johngeorgewright/targetd/commit/35fb5e0c36e3e4138cf42c294cadbc40c2f65d6f))


### Bug Fixes

* correct references ([e581d14](https://github.com/johngeorgewright/targetd/commit/e581d1420aa50e4596bc9dbc327932b572c6be49))
* **deps:** update dependency @types/express-serve-static-core to v4.19.0 ([2995d0a](https://github.com/johngeorgewright/targetd/commit/2995d0abfcade91d38145e99cb37adfd2c070765))
* **deps:** update dependency @types/express-serve-static-core to v4.19.1 ([e04c7f9](https://github.com/johngeorgewright/targetd/commit/e04c7f9adf042adf78c5c82cca3b8d79a59687df))
* **deps:** update dependency @types/express-serve-static-core to v4.19.2 ([17d0294](https://github.com/johngeorgewright/targetd/commit/17d02942695c68eaae6f4bb9c50efa53f7a9bdeb))
* **deps:** update dependency @types/express-serve-static-core to v4.19.3 ([4ccfe71](https://github.com/johngeorgewright/targetd/commit/4ccfe71388cc11de6eddbb7d5f5c0348aa99acd7))
* **deps:** update dependency @types/express-serve-static-core to v4.19.5 ([8476822](https://github.com/johngeorgewright/targetd/commit/84768227b9493cccfab144de8f98ee578cddfc3a))
* **deps:** update dependency @types/express-serve-static-core to v4.19.6 ([c30a224](https://github.com/johngeorgewright/targetd/commit/c30a224bd63456eca191bfb1d58792a6d9856d80))
* **deps:** update dependency express to v4.18.3 ([0a56fe9](https://github.com/johngeorgewright/targetd/commit/0a56fe9e09cdaa5b6cb98e9f30f12716aae162b8))
* **deps:** update dependency tslib to v2.6.3 ([798c7a6](https://github.com/johngeorgewright/targetd/commit/798c7a69df162c0d977fb65b680d83c95323fd42))
* **deps:** update dependency tslib to v2.7.0 ([95de94e](https://github.com/johngeorgewright/targetd/commit/95de94e43166bf40b8c3bd30407b80de2733741d))
* ensure workspace deps ([3fdd0ed](https://github.com/johngeorgewright/targetd/commit/3fdd0ed194009e22d82ed179b4b5bf9443eb7ffb))
* import 3rd party types ([da47689](https://github.com/johngeorgewright/targetd/commit/da4768959c903ff89301ec28afdb548194ee526c))
* **server:** allow promises ([7d4e1e4](https://github.com/johngeorgewright/targetd/commit/7d4e1e4103318e8875d78a457fe3ab30347dee3c))
* **server:** error types ([1dc57e9](https://github.com/johngeorgewright/targetd/commit/1dc57e907007481c97a78140824fd7bd0d1b5246))
* **server:** remove usused import ([7540f49](https://github.com/johngeorgewright/targetd/commit/7540f49b964de0d0c64b40e4fbcd1f0d14d437e8))
* **server:** returned type ([e1943ff](https://github.com/johngeorgewright/targetd/commit/e1943ffaa1ae056fb80605ef3800d9502bf2bd92))
* types ([d80cbba](https://github.com/johngeorgewright/targetd/commit/d80cbbaae80adac83486370b07b0a7e8445d5bd5))


### Performance Improvements

* reference required zod exports ([87bb323](https://github.com/johngeorgewright/targetd/commit/87bb323232899164cda2c873f8181cf323007c8f))


### Code Refactoring

* meta data typing ([abe3f25](https://github.com/johngeorgewright/targetd/commit/abe3f255b11075bd2b2b575de71df3e3deaa598c))
* rename dataparser to payloadparser ([52cd705](https://github.com/johngeorgewright/targetd/commit/52cd70579ddffba588bbb8b86029e2cc30441818))
* rename validators to parsers ([99c1014](https://github.com/johngeorgewright/targetd/commit/99c10142a0c716eb2c4a148a0f3561b85f222bc1))
* shortner api method names ([eb7c900](https://github.com/johngeorgewright/targetd/commit/eb7c9003c747c80236ec07d912850c8700eff350))

## [8.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/server-v7.0.2...@targetd/server-vv8.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.

### Code Refactoring

* meta data typing ([abe3f25](https://github.com/johngeorgewright/targetd/commit/abe3f255b11075bd2b2b575de71df3e3deaa598c))

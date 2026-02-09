# Changelog

## [6.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/json-schema-v5.0.0...@targetd/json-schema-v6.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.
* moving to jsr deployments
* DataParser --> PayloadParser
* Parsers are named appended with `Parser`
* `useDataParser` and `userDataParsers` have been combined in to `useData`
* Anything called "validator" is now a "parser"

### Features

* converting everything to deno ([bf3b252](https://github.com/johngeorgewright/targetd/commit/bf3b25262c8c4c0a2522bdf663744b5386c49180))
* insert data without strict checks ([cbaa0fb](https://github.com/johngeorgewright/targetd/commit/cbaa0fb18964a42d7a77ae1f69a15cfcf68e68ca))
* **json-schema:** reusable refs ([bfae408](https://github.com/johngeorgewright/targetd/commit/bfae408f64976147b5a01e9880a019be8d73a864))


### Bug Fixes

* correct bin path ([19019c6](https://github.com/johngeorgewright/targetd/commit/19019c696a510a6b05e179cf68d72776018cb735))
* **deps:** update dependency tslib to v2.6.3 ([798c7a6](https://github.com/johngeorgewright/targetd/commit/798c7a69df162c0d977fb65b680d83c95323fd42))
* **deps:** update dependency tslib to v2.7.0 ([95de94e](https://github.com/johngeorgewright/targetd/commit/95de94e43166bf40b8c3bd30407b80de2733741d))
* **deps:** update dependency zod-to-json-schema to v3.22.5 ([72dc92f](https://github.com/johngeorgewright/targetd/commit/72dc92f2f69348a1143f41f1d256a6cfcfa84288))
* **deps:** update dependency zod-to-json-schema to v3.23.0 ([626b2ad](https://github.com/johngeorgewright/targetd/commit/626b2adfecf96040c0adf63aaf25323261f8a8f7))
* **deps:** update dependency zod-to-json-schema to v3.23.1 ([d0a8ec2](https://github.com/johngeorgewright/targetd/commit/d0a8ec24933af3b1f54197b94999abbf8e45f0eb))
* **deps:** update dependency zod-to-json-schema to v3.23.2 ([bf6b412](https://github.com/johngeorgewright/targetd/commit/bf6b41289c43da26a26acf72a39ef688973bb2c7))
* **deps:** update dependency zod-to-json-schema to v3.23.3 ([2ecb227](https://github.com/johngeorgewright/targetd/commit/2ecb22766ce91b1061c78da8882e2f93924d4273))
* ensure workspace deps ([3fdd0ed](https://github.com/johngeorgewright/targetd/commit/3fdd0ed194009e22d82ed179b4b5bf9443eb7ffb))
* import 3rd party types ([da47689](https://github.com/johngeorgewright/targetd/commit/da4768959c903ff89301ec28afdb548194ee526c))
* **json-schema:** absolute import ([d9d95b7](https://github.com/johngeorgewright/targetd/commit/d9d95b7d72ba6027741a28a15bbb6905aaefc2fb))
* **json-schema:** access a switch map ([b6adb25](https://github.com/johngeorgewright/targetd/commit/b6adb252feb5c4d5eca2a5144498b7e6b3b9d15f))
* **json-schema:** export cli ([a202b2f](https://github.com/johngeorgewright/targetd/commit/a202b2fcc2ad27085d4190008e5e6e3c9fdce552))
* **json-schema:** npm compat ([ab2777c](https://github.com/johngeorgewright/targetd/commit/ab2777c0db9daabe61ec8e56149470f0450c13bc))
* **json-schema:** zod@v4 ([fb8a115](https://github.com/johngeorgewright/targetd/commit/fb8a115e17d56e765b7bbda7357ac97377ea1862))
* **json-schema:** zod@v4 ([c08e4bf](https://github.com/johngeorgewright/targetd/commit/c08e4bf63529cb3881dc0294f6a92e32b089b3d6))
* **json-shcmea:** correct yargs usage ([272dc9e](https://github.com/johngeorgewright/targetd/commit/272dc9eb2673083cd4793440eacae00485258aac))


### Performance Improvements

* reference required zod exports ([87bb323](https://github.com/johngeorgewright/targetd/commit/87bb323232899164cda2c873f8181cf323007c8f))


### Reverts

* major import without breaking change ([6745423](https://github.com/johngeorgewright/targetd/commit/6745423576bfa0afe8805e54efe6e63f15b13411))


### Miscellaneous Chores

* @targetd/api@8 ([7e48e8b](https://github.com/johngeorgewright/targetd/commit/7e48e8b24e22d546decce24a51c4db24242b1621))


### Code Refactoring

* rename dataparser to payloadparser ([52cd705](https://github.com/johngeorgewright/targetd/commit/52cd70579ddffba588bbb8b86029e2cc30441818))
* rename parsers ([8e18fcd](https://github.com/johngeorgewright/targetd/commit/8e18fcd6e32883f56d695be6f0b700d3869ba1f3))
* rename validators to parsers ([99c1014](https://github.com/johngeorgewright/targetd/commit/99c10142a0c716eb2c4a148a0f3561b85f222bc1))
* shortner api method names ([eb7c900](https://github.com/johngeorgewright/targetd/commit/eb7c9003c747c80236ec07d912850c8700eff350))

## [5.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/json-schema-v4.2.2...@targetd/json-schema-vv5.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.

### Reverts

* major import without breaking change ([6745423](https://github.com/johngeorgewright/targetd/commit/6745423576bfa0afe8805e54efe6e63f15b13411))


### Miscellaneous Chores

* @targetd/api@8 ([7e48e8b](https://github.com/johngeorgewright/targetd/commit/7e48e8b24e22d546decce24a51c4db24242b1621))

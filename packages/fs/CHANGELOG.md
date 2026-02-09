# Changelog

## [8.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/fs-v7.0.0...@targetd/fs-v8.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.
* moving to jsr deployments
* Requires latest @targetd/api
* `useDataParser` and `userDataParsers` have been combined in to `useData`
* Anything called "validator" is now a "parser"

### Features

* converting everything to deno ([bf3b252](https://github.com/johngeorgewright/targetd/commit/bf3b25262c8c4c0a2522bdf663744b5386c49180))
* **fs:** createdisposablewatcher ([01bb73f](https://github.com/johngeorgewright/targetd/commit/01bb73f35f23683a83fcbba4257c31956966d7af))
* **fs:** lazy load yaml library ([ac2636b](https://github.com/johngeorgewright/targetd/commit/ac2636bbb5e0af74f8d8e8532b9e6d3c645b4b30))
* **fs:** make watch optionally disposable ([5145188](https://github.com/johngeorgewright/targetd/commit/5145188bb681a2f60938e7fd0cfe81db43c3ad97))
* update @targetd/api ([7c201cc](https://github.com/johngeorgewright/targetd/commit/7c201cc619f8d46e64aee8bb5fd324a9c1f9760f))


### Bug Fixes

* **deps:** update dependency tslib to v2.6.3 ([798c7a6](https://github.com/johngeorgewright/targetd/commit/798c7a69df162c0d977fb65b680d83c95323fd42))
* **deps:** update dependency tslib to v2.7.0 ([95de94e](https://github.com/johngeorgewright/targetd/commit/95de94e43166bf40b8c3bd30407b80de2733741d))
* **deps:** update dependency yaml to v2.4.0 ([7eeb627](https://github.com/johngeorgewright/targetd/commit/7eeb6270cf4a2f4c7d2721250d33b6e1f8db6f1e))
* **deps:** update dependency yaml to v2.4.1 ([648a708](https://github.com/johngeorgewright/targetd/commit/648a708b7c72b48c42587937eab372b5c275e26a))
* **deps:** update dependency yaml to v2.4.2 ([968c5c4](https://github.com/johngeorgewright/targetd/commit/968c5c49fea25e89dcd194b89ed96ee45eaa70f1))
* **deps:** update dependency yaml to v2.4.3 ([7af6c06](https://github.com/johngeorgewright/targetd/commit/7af6c068f560ac9e7458ebbb1f9e03bfd481f936))
* **deps:** update dependency yaml to v2.4.4 ([c18c8fc](https://github.com/johngeorgewright/targetd/commit/c18c8fcae6578a6504e512629e75158d5db0d290))
* **deps:** update dependency yaml to v2.4.5 ([0d2e554](https://github.com/johngeorgewright/targetd/commit/0d2e5548767df52bf22b8d55d8ace37b2c6b137c))
* **deps:** update dependency yaml to v2.5.0 ([66b7b25](https://github.com/johngeorgewright/targetd/commit/66b7b257b195bd8f08c5c0404386003dd0f4e610))
* **deps:** update dependency yaml to v2.5.1 ([b0c8647](https://github.com/johngeorgewright/targetd/commit/b0c86471512f19857976b9c907c44793d63bd658))
* ensure workspace deps ([3fdd0ed](https://github.com/johngeorgewright/targetd/commit/3fdd0ed194009e22d82ed179b4b5bf9443eb7ffb))
* **fs:** allow other properties ([0a6f41e](https://github.com/johngeorgewright/targetd/commit/0a6f41e9215a382954e07d31c01c5e2486897df7))
* **fs:** switch to using node watch ([5a0a3e0](https://github.com/johngeorgewright/targetd/commit/5a0a3e081846d61020beea8bafc93a74a8c545bd))
* **fs:** use zod/v4 ([5d68b60](https://github.com/johngeorgewright/targetd/commit/5d68b6041bfca5696b9c16c0640a7e28e0896ab6))
* remove dispoable from watch ([ee0e9fc](https://github.com/johngeorgewright/targetd/commit/ee0e9fc42ebf1b940f1693a7e18d870f64ac5b9a))


### Performance Improvements

* reference required zod exports ([87bb323](https://github.com/johngeorgewright/targetd/commit/87bb323232899164cda2c873f8181cf323007c8f))


### Reverts

* major import without breaking change ([6745423](https://github.com/johngeorgewright/targetd/commit/6745423576bfa0afe8805e54efe6e63f15b13411))


### Miscellaneous Chores

* @targetd/api@8 ([7e48e8b](https://github.com/johngeorgewright/targetd/commit/7e48e8b24e22d546decce24a51c4db24242b1621))


### Code Refactoring

* rename validators to parsers ([99c1014](https://github.com/johngeorgewright/targetd/commit/99c10142a0c716eb2c4a148a0f3561b85f222bc1))
* shortner api method names ([eb7c900](https://github.com/johngeorgewright/targetd/commit/eb7c9003c747c80236ec07d912850c8700eff350))

## [7.0.0](https://github.com/johngeorgewright/targetd/compare/@targetd/fs-v6.0.2...@targetd/fs-vv7.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* Data generics have changed.

### Reverts

* major import without breaking change ([6745423](https://github.com/johngeorgewright/targetd/commit/6745423576bfa0afe8805e54efe6e63f15b13411))


### Miscellaneous Chores

* @targetd/api@8 ([7e48e8b](https://github.com/johngeorgewright/targetd/commit/7e48e8b24e22d546decce24a51c4db24242b1621))

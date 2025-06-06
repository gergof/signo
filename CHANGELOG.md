# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.2](https://github.com/gergof/signo/compare/v1.2.1...v1.2.2) (2025-05-20)


### Bug Fixes

* **AuthenticodeSigningEngine:** Remove forced double signing since SHA1 is unsupported for most TSAs as of May 2025 ([bc82d48](https://github.com/gergof/signo/commit/bc82d483dece1df7e3dd2824a94da598ee6e72a8))

### [1.2.1](https://github.com/gergof/signo/compare/v1.2.0...v1.2.1) (2025-05-12)


### Bug Fixes

* **api:** Added more detailed errors when signature computation fails in the API ([bece098](https://github.com/gergof/signo/commit/bece0986c0b0508c5938da3f2d3afb4c2be60c06))

## [1.2.0](https://github.com/gergof/signo/compare/v1.1.7...v1.2.0) (2025-02-25)


### Features

* Allow multiple simultaneous signatures by using separate sessions for each operation ([bcb015b](https://github.com/gergof/signo/commit/bcb015bbfb0d39c5c6515fa11c0327664b79394d))

### [1.1.7](https://github.com/gergof/signo/compare/v1.1.6...v1.1.7) (2024-02-19)


### Bug Fixes

* **WebServer:** Listen on IPv6 addresses as well ([f9865b8](https://github.com/gergof/signo/commit/f9865b8e014e4dab02110776f91e210556bf6ee6))

### [1.1.6](https://github.com/gergof/signo/compare/v1.1.5...v1.1.6) (2024-02-14)


### Bug Fixes

* Signo was only listening on localhost ([65bcbf0](https://github.com/gergof/signo/commit/65bcbf01b79e529bd2ef40a19046ed2544f4661a))


### Documentation

* Added login instructions ([b5c6f3c](https://github.com/gergof/signo/commit/b5c6f3cea75da3cbd38900fb09d0d69d7c801f96))
* Nodejs 18 is also supported ([5d953ac](https://github.com/gergof/signo/commit/5d953ac662c64cb3d1de4260c822c92ad23377c3))

### [1.1.5](https://github.com/gergof/signo/compare/v1.1.4...v1.1.5) (2024-02-12)


### Bug Fixes

* Fixed static files not included in build ([7020230](https://github.com/gergof/signo/commit/70202308d5610a28b4ea652bc286014fb618a1f5))

### [1.1.4](https://github.com/gergof/signo/compare/v1.1.3...v1.1.4) (2024-02-12)


### Bug Fixes

* Fixed ejs views not included in build ([cbf3fa8](https://github.com/gergof/signo/commit/cbf3fa87fe7f9c2f1600a4ae5c8abaf20d9db6c4))


### Documentation

* Update docs ([c722f0b](https://github.com/gergof/signo/commit/c722f0b918c94374460d5bb7a67eee0df2c3a58a))

### [1.1.3](https://github.com/gergof/signo/compare/v1.1.2...v1.1.3) (2024-02-12)


### Bug Fixes

* Move rimraf to dependency from dev dependencies ([92bbd0e](https://github.com/gergof/signo/commit/92bbd0ecc41b7d37963509d6a12505b501521023))

### [1.1.2](https://github.com/gergof/signo/compare/v1.1.1...v1.1.2) (2024-02-12)


### Build/CI

* Use node 18 for building ([bb11b51](https://github.com/gergof/signo/commit/bb11b5169a7f2ee838f6a67516670e4f2426dc65))

### [1.1.1](https://github.com/gergof/signo/compare/v1.1.0...v1.1.1) (2024-02-12)


### Documentation

* Added comment about running it as root ([0eda5ab](https://github.com/gergof/signo/commit/0eda5abcd4b42772a0f0ac06eb8c7598bb6dcd5b))
* Added yubikey example ([8d6d763](https://github.com/gergof/signo/commit/8d6d763d81c4cda10bd95a9c6db4b2834c099f83))

## [1.1.0](https://github.com/gergof/signo/compare/v1.0.0...v1.1.0) (2024-02-06)


### Features

* Added command for managing signo using a systemd service ([b9e0ef9](https://github.com/gergof/signo/commit/b9e0ef913c0fc5dd97725b77ee6c6aa1536f7f95))


### Documentation

* Added documentation for service command ([a2fc211](https://github.com/gergof/signo/commit/a2fc211797f0aa7d639754b6e5467271cf0da6bc))

## [1.0.0](https://github.com/gergof/signo/compare/v0.1.8...v1.0.0) (2024-02-06)


### Features

* Added support for SQLite databases ([d5a99e6](https://github.com/gergof/signo/commit/d5a99e69964664b5b6c0527a67eb420b408d841d))


### Bug Fixes

* Fix crash when signing fails due to a pkcs11 error ([273f0fa](https://github.com/gergof/signo/commit/273f0fa52fc6e1db0cae0aec5ecc56849abcb0ce))
* Fixed that signing engine type was not selected when editing it ([43fd23e](https://github.com/gergof/signo/commit/43fd23e91a078b8c5650ed2149c07833381cb973))

### [0.1.8](https://github.com/gergof/signo/compare/v0.1.7...v0.1.8) (2024-02-02)

### [0.1.7](https://github.com/gergof/signo/compare/v0.1.6...v0.1.7) (2024-01-23)


### Bug Fixes

* **AuthenticodeSigningEngine:** Allow any key length for ECDSA signatures when encoding them as ASN.1 ([e996f98](https://github.com/gergof/signo/commit/e996f9881d391e2ef9ee6bfd69e2c19b58e1fa7f))

### [0.1.6](https://github.com/gergof/signo/compare/v0.1.5...v0.1.6) (2024-01-22)


### Bug Fixes

* Remove private from package.json ([9cccdec](https://github.com/gergof/signo/commit/9cccdec0781799f47e23f58273c7fa77a087d32e))

### [0.1.5](https://github.com/gergof/signo/compare/v0.1.4...v0.1.5) (2024-01-22)


### Build/CI

* Fix in package.json ([3070c92](https://github.com/gergof/signo/commit/3070c92e93ebf10d1f0b3a02fddb16d1e71bc78f))

### [0.1.4](https://github.com/gergof/signo/compare/v0.1.3...v0.1.4) (2024-01-22)


### Build/CI

* Updated buid script and added bin entrypoint ([32a4846](https://github.com/gergof/signo/commit/32a48468f1bfb60d4cb77d3484d221e5726f99cd))

### [0.1.3](https://github.com/gergof/signo/compare/v0.1.2...v0.1.3) (2024-01-19)


### Build/CI

* Fixed Dockerfile ([ece0605](https://github.com/gergof/signo/commit/ece06056172f612a07893e01f8f157af5afa516d))

### [0.1.2](https://github.com/gergof/signo/compare/v0.1.1...v0.1.2) (2024-01-19)


### Features

* Attach the whole certificate chain when signing with authenticode if present on the token ([fca39c2](https://github.com/gergof/signo/commit/fca39c2a94aeab5b5f5af71308928956c4c08b22))


### Documentation

* Added planned features ([8287713](https://github.com/gergof/signo/commit/82877132cd38bb87bb4867c67543daf7899cf4d6))


### Build/CI

* Added dockerfile and drone build script ([55279d1](https://github.com/gergof/signo/commit/55279d1f2e449b907e93573a31235e182e97984b))

### 0.1.1 (2024-01-18)


### Features

* Added signing engine for authenticode ([037fb46](https://github.com/gergof/signo/commit/037fb461b4800bead723af6f7d783b3194b5493b))
* Added timestamping and nested signing for authenticode if digest is not SHA1 ([fd7ae94](https://github.com/gergof/signo/commit/fd7ae949af79aa6df00f3a0c7abe51087420ec13))
* **api:** Added API and API client for signing ([26323c8](https://github.com/gergof/signo/commit/26323c8b41d52d49f353ff1b48065402a2555ce5))
* **engines:** Added signing engines menu with plain signing engine ([7018c97](https://github.com/gergof/signo/commit/7018c97abcecade3dee44148d160bac4eae0556f))
* Implemented configuration layer, datasource and logging and created dev environment ([dc4ed02](https://github.com/gergof/signo/commit/dc4ed029ce48b5fe4eb06db3ecf69b9480ae4636))
* Implemented skeleton of webserver ([75b7120](https://github.com/gergof/signo/commit/75b71207849e92bb1bf0fc55f940ab2cfceefdee))
* **signees:** Added signees routes ([a3c7fbd](https://github.com/gergof/signo/commit/a3c7fbdc162f7839aeaebc0bc85c0fbf565f3fc4))
* **tokens:** Added certificate list for tokens ([5de52d9](https://github.com/gergof/signo/commit/5de52d988d241eed3fae65c0b6b3ddf485cdcaac))
* **tokens:** Added token listing, token informations and token activation ([7bffd39](https://github.com/gergof/signo/commit/7bffd3915db4e8f9492dc4a0419ac24a2ae6fcba))
* **users:** Added users routes ([daa3372](https://github.com/gergof/signo/commit/daa337271522467de18e69385076d9f28525c812))
* **WebServer:** Implemented session handling using typeORM ([eb079f3](https://github.com/gergof/signo/commit/eb079f38f62f7c3811557a24b4f8a03d179538da))


### Build/CI

* Set up core project ([bfae588](https://github.com/gergof/signo/commit/bfae5889134dc3e2ab445621cbd091fb6ae2dae8))


### Refactor

* **database:** Refactored database connection setup to make it cleaner ([0e91083](https://github.com/gergof/signo/commit/0e91083012359b99f55cad97f8a40454bfb686c9))


### Documentation

* Added basic documentation ([285a88d](https://github.com/gergof/signo/commit/285a88db2f7e838e404672f18a679ca454e31137))

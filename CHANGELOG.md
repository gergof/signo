# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

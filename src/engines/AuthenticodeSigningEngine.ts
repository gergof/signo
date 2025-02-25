import asn1 from 'asn1js';
import { AuthenticodeSigner, PEFile, SignOptions } from 'authenticode-sign';
import * as pkcs11 from 'graphene-pk11';
import fetch from 'node-fetch';

import OIDs from '../utils/OIDs.js';

import SigningEngine from './SigningEngine.js';

class AuthenticodeSigningEngine extends SigningEngine {
	private static SupportedDigests = ['SHA1', 'SHA256', 'SHA512'] as const;

	private static SupportedAlgorithms = ['RSA', 'ECDSA', 'DSA'] as const;

	private static SHA1Mechanisms = {
		RSA: 'SHA1_RSA_PKCS',
		ECDSA: 'ECDSA_SHA1',
		DSA: 'DSA_SHA1'
	} as const;

	public supportsStream() {
		return false;
	}

	public async sign(
		content: Buffer,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer> {
		this.checkTokenActivated();

		const key = this.getPrivateKey();
		const cert = this.getCert();
		const intermediateCerts = this.getIntermediateCerts(cert);

		this.logger.debug(
			`Found ${intermediateCerts.length} certificates to add to the chain`
		);

		const digestAlgo = this.getDigestAlgorithm(mechanism as string);
		const encryptionAlgo = this.getEncryptionAlgorithm(mechanism as string);

		if (digestAlgo != 'SHA1') {
			// executables should be double signed with SHA1
			this.logger.debug(
				`Double signing executable with SHA1 and ${digestAlgo}`
			);
			const sha1Signed = await this.createSignedExecutable(
				content,
				key,
				cert,
				intermediateCerts,
				AuthenticodeSigningEngine.SHA1Mechanisms[encryptionAlgo],
				'SHA1',
				encryptionAlgo,
				{ replace: true }
			);
			const signed = await this.createSignedExecutable(
				sha1Signed,
				key,
				cert,
				intermediateCerts,
				mechanism,
				digestAlgo,
				encryptionAlgo,
				{ nest: true }
			);

			return signed;
		}

		const signed = await this.createSignedExecutable(
			content,
			key,
			cert,
			intermediateCerts,
			mechanism,
			digestAlgo,
			encryptionAlgo,
			{ replace: true }
		);

		return signed;
	}

	public async signStream(): Promise<Buffer> {
		throw new Error('Not implemented');
	}

	private async createSignedExecutable(
		content: Buffer,
		key: pkcs11.PrivateKey,
		cert: pkcs11.X509Certificate,
		intermediateCerts: pkcs11.X509Certificate[],
		mechanism: pkcs11.MechanismType,
		digestAlgo: (typeof AuthenticodeSigningEngine.SupportedDigests)[number],
		encryptionAlgo: (typeof AuthenticodeSigningEngine.SupportedAlgorithms)[number],
		extraOpts: SignOptions
	): Promise<Buffer> {
		this.logger.debug('Signing with algorithms', {
			digest: digestAlgo,
			encryption: encryptionAlgo
		});

		this.logger.debug('Initializing AuthenticodeSigner');
		const signer = new AuthenticodeSigner({
			getDigestAlgorithmOid: () => OIDs.digestAlgos[digestAlgo],
			getSignatureAlgorithmOid: () =>
				OIDs.signAlgos[encryptionAlgo][digestAlgo],
			getCertificate: () => cert.value,
			getIntermediateCertificates: () =>
				intermediateCerts.map(cert => cert.value),
			digest: dataIterator => {
				this.logger.debug('Hashing data');
				const digest = this.session.createDigest(digestAlgo);

				for (;;) {
					const it = dataIterator.next();

					if (it.done) {
						break;
					}

					digest.update(it.value);
				}

				return Promise.resolve(digest.final());
			},
			sign: dataIterator => {
				this.logger.debug('Signing data');
				const sign = this.session.createSign(mechanism, key);

				for (;;) {
					const it = dataIterator.next();

					if (it.done) {
						break;
					}

					sign.update(it.value);
				}

				const signature = sign.final();

				// if algo is ECDSA, convert RS to ASN.1
				if (encryptionAlgo == 'ECDSA') {
					const ecParams = key.getAttribute({ paramsECDSA: null });

					if (!ecParams.paramsECDSA) {
						throw new Error('Failed to get key curve');
					}

					const curve = pkcs11.NamedCurve.getByBuffer(
						ecParams.paramsECDSA
					);

					if (signature.byteLength != (curve.size / 8) * 2) {
						// not valid RS
						throw new Error(
							`Failed to encode ECDSA signature as ASN.1 sequence. Expected length of ${
								(curve.size / 8) * 2
							} but got ${signature.byteLength}`
						);
					}

					const sequence = new asn1.Sequence({
						value: [
							new asn1.Integer({
								valueHex: signature.subarray(0, curve.size / 8)
							}),
							new asn1.Integer({
								valueHex: signature.subarray(
									curve.size / 8,
									(curve.size / 8) * 2
								)
							})
						]
					});

					return Promise.resolve(Buffer.from(sequence.toBER()));
				}

				return Promise.resolve(signature);
			},
			timestamp: async data => {
				const resp = await fetch('http://timestamp.digicert.com', {
					method: 'POST',
					headers: {
						'Content-type': 'application/timestamp-query',
						'Content-length': data.byteLength.toString()
					},
					body: data
				});

				return Buffer.from(await resp.arrayBuffer());
			}
		});

		this.logger.debug('Loading executable');
		const exe = new PEFile(content);

		this.logger.debug('Signing executable');
		const signed = await signer.sign(exe, extraOpts);

		return signed;
	}

	private getCert(): pkcs11.X509Certificate {
		const certs = this.session.find({
			class: pkcs11.ObjectClass.CERTIFICATE,
			id: this.slot,
			certType: pkcs11.CertificateType.X_509
		});

		if (certs.length < 1) {
			this.logger.warn(
				`X.509 certificate with ID ${this.slot.toString(
					'hex'
				)} not found on token ${this.token.tokenId}`
			);
			throw new Error('Certificate not found');
		}

		return certs.items(0).toType();
	}

	private getIntermediateCerts(
		cert: pkcs11.X509Certificate
	): pkcs11.X509Certificate[] {
		if (Buffer.compare(cert.issuer, cert.subject) == 0) {
			// self-signed cert, would result in infinite loop
			return [];
		}

		const certs = this.session.find({
			class: pkcs11.ObjectClass.CERTIFICATE,
			certType: pkcs11.CertificateType.X_509,
			subject: cert.issuer
		});

		if (certs.length > 0) {
			const intermediateCert = certs
				.items(0)
				.toType() as pkcs11.X509Certificate;
			return [
				intermediateCert,
				...this.getIntermediateCerts(intermediateCert)
			];
		}

		return [];
	}

	private getDigestAlgorithm(
		mechanism: string
	): (typeof AuthenticodeSigningEngine.SupportedDigests)[number] {
		for (const digest of AuthenticodeSigningEngine.SupportedDigests) {
			if (mechanism.toUpperCase().includes(digest)) {
				return digest;
			}
		}

		throw new Error(
			'Unsupported digest algorithm. Supported: ' +
				AuthenticodeSigningEngine.SupportedDigests.join(', ')
		);
	}

	private getEncryptionAlgorithm(
		mechanism: string
	): (typeof AuthenticodeSigningEngine.SupportedAlgorithms)[number] {
		for (const algo of AuthenticodeSigningEngine.SupportedAlgorithms) {
			if (mechanism.toUpperCase().includes(algo)) {
				return algo;
			}
		}

		throw new Error(
			'Unsupported encryption algorithm. Supported: ' +
				AuthenticodeSigningEngine.SupportedAlgorithms.join(', ')
		);
	}
}

export default AuthenticodeSigningEngine;

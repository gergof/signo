import asn1 from 'asn1js';
import { AuthenticodeSigner, PEFile } from 'authenticode-sign';
import * as pkcs11 from 'graphene-pk11';

import OIDs from '../utils/OIDs.js';

import SigningEngine from './SigningEngine.js';

class AuthenticodeSigningEngine extends SigningEngine {
	private static SupportedDigests = ['SHA1', 'SHA256', 'SHA512'] as const;

	private static SupportedAlgorithms = ['RSA', 'ECDSA', 'DSA'] as const;

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

		const digestAlgo = this.getDigestAlgorithm(mechanism as string);
		const encryptionAlgo = this.getEncryptionAlgorithm(mechanism as string);

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
			digest: dataIterator => {
				this.logger.debug('Hashing data');
				const digest = this.token.getSession().createDigest(digestAlgo);

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
				const sign = this.token.getSession().createSign(mechanism, key);

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
					if (signature.byteLength == 70) {
						// already in ASN.1 format probably
						return Promise.resolve(signature);
					}

					if (signature.byteLength != 64) {
						// not valid RS
						throw new Error(
							'Failed to encode ECDSA signature as ASN.1 sequence'
						);
					}

					const sequence = new asn1.Sequence({
						value: [
							new asn1.Integer({
								valueHex: signature.subarray(0, 32)
							}),
							new asn1.Integer({
								valueHex: signature.subarray(32, 64)
							})
						]
					});

					return Promise.resolve(Buffer.from(sequence.toBER()));
				}

				return Promise.resolve(signature);
			}
		});

		this.logger.debug('Loading executable');
		const exe = new PEFile(content);

		this.logger.debug('Signing executable');
		const signed = await signer.sign(exe, { replace: true });

		return signed;
	}

	public async signStream(): Promise<Buffer> {
		throw new Error('Not implemented');
	}

	private getCert(): pkcs11.X509Certificate {
		const certs = this.token.getSession().find({
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

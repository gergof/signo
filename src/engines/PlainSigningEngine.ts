import * as pkcs11 from 'graphene-pk11';

import SigningEngine from './SigningEngine.js';

class PlainSigningEngine extends SigningEngine {
	public supportsStream() {
		return true;
	}

	public async sign(
		content: Buffer,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer> {
		this.checkTokenActivated();

		const key = this.getPrivateKey();
		const sign = this.session.createSign(mechanism, key);
		const signature = sign.once(content);

		return signature;
	}

	public async signStream(
		stream: NodeJS.ReadableStream,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer> {
		this.checkTokenActivated();

		const key = this.getPrivateKey();
		const sign = this.session.createSign(mechanism, key);

		return new Promise((resolve, reject) => {
			stream.on('data', data => {
				try {
					sign.update(data);
				} catch (e) {
					reject(e);
				}
			});

			stream.on('error', e => {
				reject(e);
			});

			stream.on('end', () => {
				try {
					resolve(sign.final());
				} catch (e) {
					reject(e);
				}
			});
		});
	}
}

export default PlainSigningEngine;

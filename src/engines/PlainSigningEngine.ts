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
		const sign = this.token.getSession().createSign(mechanism, key);
		const signature = sign.once(content);

		return signature;
	}

	public async signStream(
		stream: NodeJS.ReadableStream,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer> {
		this.checkTokenActivated();

		const key = this.getPrivateKey();
		const sign = this.token.getSession().createSign(mechanism, key);

		return new Promise((resolve, reject) => {
			stream.on('data', data => {
				sign.update(data);
			});

			stream.on('error', e => {
				reject(e);
			});

			stream.on('end', () => {
				resolve(sign.final());
			});
		});
	}
}

export default PlainSigningEngine;

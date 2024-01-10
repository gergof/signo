import * as pkcs11 from 'graphene-pk11';

import { ChildLogger } from '../Logger.js';
import TokenWrapper from '../TokenWrapper.js';

abstract class SigningEngine {
	protected token: TokenWrapper;
	protected slot: Buffer;
	protected logger: ChildLogger;

	constructor(token: TokenWrapper, slot: string, logger: ChildLogger) {
		this.token = token;
		this.slot = Buffer.from(
			slot.padStart(slot.length + (slot.length % 2), '0'),
			'hex'
		);
		this.logger = logger;
	}

	public abstract supportsStream(): boolean;
	public abstract sign(
		content: Buffer,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer>;
	public abstract signStream(
		stream: NodeJS.ReadableStream,
		mechanism: pkcs11.MechanismType
	): Promise<Buffer>;

	protected checkTokenActivated(): void {
		if (!this.token.isActivated()) {
			this.logger.warn(
				`Token ${this.token.tokenId} not activated for signing with ${this.constructor.name}.`
			);
			throw new Error('Token is not activated');
		}
	}

	protected getPrivateKey(): pkcs11.PrivateKey {
		const keys = this.token.getSession().find({
			class: pkcs11.ObjectClass.PRIVATE_KEY,
			id: this.slot
		});

		if (keys.length < 1) {
			this.logger.warn(
				`Private key with ID ${this.slot.toString(
					'hex'
				)} not found on token ${this.token.tokenId}`
			);
			throw new Error('Private key not found');
		}

		return keys.items(0).toType();
	}
}

export default SigningEngine;

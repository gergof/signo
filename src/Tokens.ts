import * as pkcs11 from 'graphene-pk11';

import { ChildLogger } from './Logger.js';
import TokenWrapper from './TokenWrapper.js';
import SigningEngine from './engines/SigningEngine.js';
import SigningEngines, { SigningEngineType } from './engines/index.js';

class Tokens {
	private logger: ChildLogger;
	private config: Record<string, string>;

	private modules: Map<string, pkcs11.Module>;
	private tokens: Map<string, TokenWrapper>;

	constructor(logger: ChildLogger, config: Record<string, string>) {
		this.logger = logger;
		this.config = config;

		this.modules = new Map();
		this.tokens = new Map();
	}

	public initialize() {
		this.logger.info('Initializing PKCS11 modules');

		for (const [name, libFile] of Object.entries(this.config)) {
			this.logger.info(`Initializing module ${name}`);

			this.logger.debug(`Loading module ${name}`);
			const mod = pkcs11.Module.load(libFile, name);

			this.logger.debug(
				`Running initialization script for module ${name}`
			);
			mod.initialize();

			this.modules.set(name, mod);
		}

		this.loadTokens();
	}

	public destroy() {
		this.logger.info('Destroying token connections');

		for (const token of this.tokens.values()) {
			this.logger.debug(`Deactivating token ${token.tokenId}`);
			token.deactivate();
		}

		for (const mod of this.modules.values()) {
			this.logger.debug(`Finalizing module ${mod.libName}`);
			try {
				mod.finalize();
			} catch (e: any) {
				this.logger.log({
					message: `Failed to finalize module ${mod.libName}`,
					level: 'warn',
					err: e?.toString() || e?.message || 'Unknown error'
				});
			}
		}
	}

	public loadTokens() {
		this.logger.info('Loading tokens');

		this.tokens.clear();

		for (const mod of this.modules.values()) {
			this.logger.debug(`Loading tokens for module ${mod.libName}`);

			// get slots with a token present in them
			for (const slot of mod.getSlots(true)) {
				const token = new TokenWrapper(slot);

				this.logger.debug(`Found token ${token.tokenId}`, {
					module: mod.libName,
					slot: slot.handle.toString('hex'),
					serialNumber: slot.getToken().serialNumber,
					description: slot.slotDescription
				});

				this.tokens.set(token.tokenId, token);
			}
		}
	}

	public getTokenIds() {
		return Array.from(this.tokens.keys());
	}

	public getTokens() {
		return Array.from(this.tokens.values());
	}

	public getToken(id: string): TokenWrapper | null {
		return this.tokens.get(id) || null;
	}

	public createSigningEngine(
		engine: SigningEngineType,
		tokenId: string,
		tokenSlot: string
	): SigningEngine {
		const token = this.getToken(tokenId);

		if (!token) {
			this.logger.warn(
				`Token with id ${tokenId} not found when creating signing engine`
			);
			throw new Error('Token not found');
		}

		this.logger.debug(
			`Creating signing engine ${engine} for ${tokenId}.0x${tokenSlot}`
		);

		return new SigningEngines[engine](token, tokenSlot, this.logger);
	}
}

export default Tokens;

import * as pkcs11 from 'graphene-pk11';

import { ChildLogger } from './Logger.js';

class TokenWrapper {
	public readonly slot: pkcs11.Slot;

	public readonly tokenId: string;

	private pin: string;
	private session: pkcs11.Session | null;

	constructor(slot: pkcs11.Slot) {
		this.slot = slot;

		this.tokenId = `${this.slot.module.libName}.${
			this.slot.getToken().serialNumber
		}`;

		this.pin = '';
		this.session = null;
	}

	public isActivated() {
		return !!this.pin;
	}

	public activate(pin: string) {
		this.pin = pin;

		if (this.session) {
			// close active session so the next one will be authorized
			this.session.close();
			this.session = null;
		}

		try {
			this.getSession();
		} catch (e) {
			this.pin = '';
			throw e;
		}
	}

	public deactivate() {
		this.session?.close();
		this.session = null;
		this.pin = '';
	}

	public getSession() {
		if (!this.session) {
			this.session = this.slot.open();

			if (this.pin) {
				this.session.login(this.pin, pkcs11.UserType.USER);
			}
		}

		return this.session;
	}
}

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
			mod.finalize();
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

	public getTokens() {
		return Array.from(this.tokens.values());
	}

	public getToken(id: string): TokenWrapper | null {
		return this.tokens.get(id) || null;
	}
}

export default Tokens;

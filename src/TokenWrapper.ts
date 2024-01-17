import * as pkcs11 from 'graphene-pk11';

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
		}

		if (this.pin) {
			try {
				this.session.logout();
			} catch {
				// doing nothing
			}
			try {
				this.session.login(this.pin, pkcs11.UserType.USER);
			} catch {
				// doing nothing
			}
		}

		return this.session;
	}

	public getSigningMechanisms(): string[] {
		return Array.from(this.slot.getMechanisms())
			.filter(mech => mech.flags & pkcs11.MechanismFlag.SIGN)
			.map(mech => mech.name);
	}
}

export default TokenWrapper;

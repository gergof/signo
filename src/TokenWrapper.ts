import * as pkcs11 from 'graphene-pk11';

class TokenWrapper {
	public readonly slot: pkcs11.Slot;

	public readonly tokenId: string;

	private pin: string;

	constructor(slot: pkcs11.Slot) {
		this.slot = slot;

		this.tokenId = `${this.slot.module.libName}.${
			this.slot.getToken().serialNumber
		}`;

		this.pin = '';
	}

	public isActivated() {
		return !!this.pin;
	}

	public activate(pin: string) {
		this.pin = pin;

		this.slot.closeAll();

		try {
			this.getSession().close();
		} catch (e) {
			this.pin = '';
			throw e;
		}
	}

	public deactivate() {
		this.slot.closeAll();
		this.pin = '';
	}

	public getSession() {
		const session = this.slot.open();

		if (this.pin) {
			try {
				session.login(this.pin, pkcs11.UserType.USER);
			} catch (e) {
				// suppress already logged in error messages
				if ((e as Error).message != 'CKR_USER_ALREADY_LOGGED_IN') {
					throw e;
				}
			}
		}

		return session;
	}

	public withSession<T>(fn: (session: pkcs11.Session) => T): T {
		const session = this.getSession();

		const ret = fn(session);

		Promise.resolve(ret).then(() => session.close());

		return ret;
	}

	public getSigningMechanisms(): string[] {
		return Array.from(this.slot.getMechanisms())
			.filter(mech => mech.flags & pkcs11.MechanismFlag.SIGN)
			.map(mech => mech.name);
	}
}

export default TokenWrapper;

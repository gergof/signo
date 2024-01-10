class NonceValidator {
	private window: number;
	private nonces: Set<string>;

	constructor(window: number) {
		this.window = window;
		this.nonces = new Set();
	}

	public validate(nonce: string) {
		if (this.nonces.has(nonce)) {
			throw new Error('Reused nonce');
		}

		this.nonces.add(nonce);
		setTimeout(() => {
			this.nonces.delete(nonce);
		}, this.window * 1000);
	}
}

export default NonceValidator;

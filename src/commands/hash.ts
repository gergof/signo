/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { Command } from 'commander';

interface HashOptions {
	password: string;
	silent: boolean;
}

const hash = async (cmd: Command, options: HashOptions) => {
	if (!options.silent) {
		console.log(`Hashing input password`);
		console.log(
			'You can use this method to hash the password for the https.adminPassword configuration field.'
		);
	}

	const hash = await bcrypt.hash(options.password, 10);

	console.log((!options.silent ? 'Hashed password: ' : '') + hash);
};

export default hash;

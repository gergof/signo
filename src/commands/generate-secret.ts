/* eslint-disable no-console */
import crypto from 'crypto';

import { Command } from 'commander';

interface GenerateSecretOptions {
	bytes: number;
	silent: boolean;
}

const generateSecret = async (cmd: Command, options: GenerateSecretOptions) => {
	if (!options.silent) {
		console.log(`Generating ${options.bytes} byte long secret.`);
		console.log('Place this secret in your config.https.secret option.');
		console.log('This secret is used to encrypt sessions.');
	}

	const secret = crypto.randomBytes(options.bytes).toString('base64');

	console.log((!options.silent ? 'Generated secret: ' : '') + secret);
};

export default generateSecret;

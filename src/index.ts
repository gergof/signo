import { Command, InvalidArgumentError, Option } from 'commander';

import generateSecret from './commands/generate-secret.js';
import start from './commands/start.js';

const validateInt = (value: any) => {
	const parsed = parseInt(value);

	if (isNaN(parsed)) {
		throw new InvalidArgumentError('Not a number');
	}

	return parsed;
};

const main = () => {
	const program = new Command();
	program.name('signo').description('Signing server with PKCS#11 support');

	// log options
	program
		.addOption(
			new Option('--log-level <level>', 'log level')
				.choices(['debug', 'info', 'warn', 'error', 'crypto'])
				.default('info')
		)
		.addOption(
			new Option('--log-format <format>', 'log format')
				.choices(['text', 'json'])
				.default('text')
		)
		.addOption(
			new Option('--log-file <file>', 'rotated log file name').default(
				'signo.log'
			)
		)
		.addOption(
			new Option(
				'--crypto-log-file <file>',
				'optional file to contain only the crypto log'
			)
		);

	// commands
	program
		.command('start')
		.description('start the service')
		.requiredOption(
			'-c, --config <config file>',
			'location of the config file'
		)
		.action((options, cmd) => {
			start(cmd, options);
		});

	program
		.command('generate-secret')
		.description('generate secret for http sessions')
		.option(
			'-b, --bytes <number>',
			'length of secret in bytes',
			validateInt,
			64
		)
		.option('-s, --silent', 'only output the generated secret', false)
		.action((options, cmd) => {
			generateSecret(cmd, options);
		});

	program.parse();
};

main();

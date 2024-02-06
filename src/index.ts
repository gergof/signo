import { Argument, Command, InvalidArgumentError, Option } from 'commander';

import generateSecret from './commands/generate-secret.js';
import hash from './commands/hash.js';
import service from './commands/service.js';
import sign from './commands/sign.js';
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

	program
		.command('hash')
		.description('hash an input password')
		.option('-s, --silent', 'only output the hash', false)
		.arguments('<password>')
		.action((password, options, cmd) => {
			hash(cmd, { ...options, password });
		});

	program
		.command('sign')
		.description('sign file using signo server')
		.option(
			'-s, --server <server>',
			'endpoint of signo server',
			'https://localhost:3000/'
		)
		.requiredOption('--client <client>', 'ID of signee')
		.requiredOption('--secret <secret>', 'shared secret of signee')
		.requiredOption('--engine <engine>', 'engine to use for signing')
		.option(
			'-o, --output <output>',
			'save signature to file instead of outputting it as hex'
		)
		.option('--unsafe', 'accept any https certificate')
		.arguments('<file>')
		.action((file, options, cmd) => {
			sign(cmd, { ...options, file });
		});

	program
		.command('service')
		.description('manage signo systemd service')
		.option(
			'--no-user',
			'(during install) do not create system user for signo',
			true
		)
		.option(
			'--password <password>',
			'(during install) specify the administrator password',
			'admin'
		)
		.option(
			'--remove-config',
			'(during remove) remove the configuration files as well',
			false
		)
		.addArgument(
			new Argument('action', 'the action to execute').choices([
				'install',
				'remove',
				'start',
				'stop'
			])
		)
		.action((action, options, cmd) => {
			service(cmd, { ...options, action });
		});

	program.parse();
};

main();

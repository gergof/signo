import { Command, Option } from 'commander';

import start from './commands/start.js';

const main = () => {
	const program = new Command();
	program.name('signo').description('Signing server with PKCS#11 support');

	// log options
	program
		.addOption(
			new Option('--log-level <level>', 'log level')
				.choices(['debug', 'info', 'warn', 'error'])
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

	program.parse();
};

main();

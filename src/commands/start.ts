import { Command } from 'commander';

import Config from '../Config.js';
import Database from '../Database.js';
import Logger from '../Logger.js';
import WebServer from '../WebServer.js';

interface StartOptions {
	config: string;
}

const start = async (cmd: Command, options: StartOptions) => {
	if (!cmd.parent) {
		return;
	}

	const commonOpts = cmd.parent.opts();

	const loggerFactory = new Logger({
		level: commonOpts.logLevel,
		format: commonOpts.logFormat,
		file: commonOpts.logFile,
		cryptoFile: commonOpts.cryptoLogFile
	});

	const logger = loggerFactory.createLogger('main');

	try {
		logger.info('Starting Signo server');

		const config = new Config(
			loggerFactory.createLogger('config'),
			options.config
		);
		await config.initialize();

		const database = new Database(
			loggerFactory.createLogger('db'),
			config.database
		);
		await database.initialize();

		const webServer = new WebServer(
			loggerFactory.createLogger('server'),
			config.https,
			database.orm
		);
		await webServer.initialize();

		// add exit handlers
		const exit = async () => {
			logger.info('Stopping Signo server');

			await webServer.destroy();
			await database.destroy();

			logger.info('Bye!');
			process.exit(0);
		};

		process.on('SIGINT', exit);
		process.on('SIGTERM', exit);
	} catch (e: any) {
		logger.error(
			'Failed to start Signo server: ' +
				(e?.toString() || e?.message || 'unknown error')
		);
		process.exit(1);
	}
};

export default start;

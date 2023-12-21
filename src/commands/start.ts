import { Command } from 'commander';

import Config from '../Config.js';
import createDataSource from '../DataSource.js';
import Logger from '../Logger.js';

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
		file: commonOpts.logFile
	});

	const logger = loggerFactory.createLogger('main');

	try {
		logger.info('Starting Signo server');

		const config = new Config(
			loggerFactory.createLogger('config'),
			options.config
		);
		await config.initialize();

		logger.info('Initializing datasource');
		const datasource = createDataSource(config.database);
		await datasource.initialize();

		logger.info('Running migrations');
		await datasource.runMigrations();

		logger.info('Synchronizing database schema');
		await datasource.synchronize();

		// add exit handlers
		const exit = async () => {
			logger.info('Stopping Signo server');

			logger.info('Destroying datasource');
			await datasource.destroy();

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

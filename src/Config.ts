import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

import { Static, Type } from '@sinclair/typebox';
import YAML from 'yaml';

import { ChildLogger } from './Logger.js';
import validatorFactory from './utils/schemaValidator.js';

const ConfigSchema = Type.Object({
	https: Type.Object({
		port: Type.Integer({ min: 1, max: 65535 }),
		key: Type.String(),
		cert: Type.String(),
		secret: Type.String(),
		adminPassword: Type.String()
	}),
	database: Type.Object({
		host: Type.String(),
		port: Type.Integer({ min: 1, max: 65535 }),
		database: Type.String(),
		user: Type.String(),
		password: Type.String()
	}),
	pkcs11Modules: Type.Array(Type.String())
});

type ConfigType = Static<typeof ConfigSchema>;

class Config {
	private logger: ChildLogger;

	private configFile: string;
	private config?: ConfigType;

	constructor(logger: ChildLogger, configFile: string) {
		this.logger = logger;
		this.configFile = configFile;
	}

	public async initialize(): Promise<void> {
		this.logger.info('Initializing configuration');

		try {
			this.logger.debug(
				`Loading configuration file contents from ${this.configFile}`
			);
			const contents = await fsp.readFile(this.configFile);

			this.logger.debug('Trying to parse configuration file');
			let parsed: any = null;

			switch (path.extname(this.configFile)) {
				case '.json':
					this.logger.debug('Parsing file as JSON');
					parsed = JSON.parse(contents.toString('utf-8'));
					break;
				case '.yml':
				case '.yaml':
					this.logger.debug('Parsing file as YAML');
					parsed = YAML.parse(contents.toString('utf-8'));
					break;
				default:
					this.logger.error(
						'Unsupported file extension: ' +
							path.extname(this.configFile)
					);
					throw new Error(
						'Unsupported config extension. Only supporting json, yml, yaml'
					);
			}

			this.logger.debug('Validating configuration');
			const validator = validatorFactory<ConfigType>(ConfigSchema);

			this.config = validator.verify(parsed);
			this.logger.info('Configuration initialized');
		} catch (e: any) {
			this.logger.error(
				'Failed to initialize configuration: ' + e?.toString() ||
					e?.message ||
					'unknown error'
			);
			throw new Error('Failed to initialize configuration');
		}
	}

	private getFilePath(filePath: string) {
		if (path.isAbsolute(filePath)) {
			return filePath;
		}

		return path.join(path.dirname(path.resolve(this.configFile)), filePath);
	}

	get https() {
		if (!this.config) {
			throw new Error('Config not initialized');
		}

		return {
			...this.config.https,
			key: fs
				.readFileSync(this.getFilePath(this.config.https.key))
				.toString('utf-8'),
			cert: fs
				.readFileSync(this.getFilePath(this.config.https.cert))
				.toString('utf-8')
		};
	}

	get database() {
		if (!this.config) {
			throw new Error('Config not initialized');
		}

		return this.config.database;
	}

	get pkcs11Modules() {
		if (!this.config) {
			throw new Error('Config not initialized');
		}

		return this.config.pkcs11Modules;
	}
}

export default Config;

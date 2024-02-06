import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { ChildLogger } from './Logger.js';
import * as migrations from './migrations/index.js'; // eslint-disable-line import/namespace
import * as models from './models/index.js';

interface MySQLDatabaseConfig {
	type: 'mysql';
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
}

interface SQLiteDatabaseConfig {
	type: 'sqlite';
	database: string;
}

type DatabaseConfig = MySQLDatabaseConfig | SQLiteDatabaseConfig;

class Database {
	private logger: ChildLogger;
	private config: DatabaseConfig;

	private datasource: DataSource;

	constructor(logger: ChildLogger, config: DatabaseConfig) {
		this.logger = logger;
		this.config = config;

		this.datasource = new DataSource({
			...config,
			logging: false,
			entities: Object.values(models),
			migrations: Object.values(migrations),
			subscribers: []
		});
	}

	public async initialize() {
		this.logger.info('Initializing database connection');
		await this.datasource.initialize();

		this.logger.info('Running migrations');
		await this.datasource.runMigrations();

		this.logger.info('Synchronizing database schema');
		await this.datasource.synchronize();
	}

	public async destroy() {
		this.logger.info('Destroying database connection');
		await this.datasource.destroy().catch(() => {});
	}

	public get orm() {
		return this.datasource;
	}
}

export default Database;

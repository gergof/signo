import 'reflect-metadata';
import { DataSource } from 'typeorm';

import * as migrations from './migrations/index.js'; // eslint-disable-line import/namespace
import * as models from './models/index.js';

interface DataSourceConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
}

const createDataSource = (config: DataSourceConfig) => {
	return new DataSource({
		type: 'mysql',
		host: config.host,
		port: config.port,
		username: config.user,
		password: config.password,
		database: config.database,
		logging: false,
		entities: Object.values(models),
		migrations: Object.values(migrations),
		subscribers: []
	});
};

export default createDataSource;

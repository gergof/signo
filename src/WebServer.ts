import path from 'path';
import { fileURLToPath } from 'url';

import FastifyCookie from '@fastify/cookie';
import FastifyFormBody from '@fastify/formbody';
import FastifySession from '@fastify/session';
import FastifyStatic from '@fastify/static';
import FastifyView from '@fastify/view';
import { TypeormStore } from 'connect-typeorm';
import Ejs from 'ejs';
import Fastify from 'fastify';
import _ from 'lodash';
import { DataSource } from 'typeorm';

import { ChildLogger } from './Logger.js';
import Tokens from './Tokens.js';
import Session from './models/Session.js';
import * as routes from './routes/index.js';
import { MINUTE } from './utils/time.js';

interface WebServerConfig {
	port: number;
	key: string;
	cert: string;
	secret: string;
	adminPassword: string;
}

class WebServer {
	private logger: ChildLogger;
	private config: WebServerConfig;

	private fastify;
	private datasource: DataSource;
	private tokens: Tokens;

	constructor(
		logger: ChildLogger,
		config: WebServerConfig,
		datasource: DataSource,
		tokens: Tokens
	) {
		this.logger = logger;
		this.config = config;
		this.datasource = datasource;
		this.tokens = tokens;

		this.logger.info('Creating WebServer instance and registering plugins');
		this.fastify = Fastify({
			logger: this.getFastifyLogger(),
			https: {
				key: this.config.key,
				cert: this.config.cert
			},
			forceCloseConnections: true
		});

		this.fastify.register(FastifyView, {
			engine: {
				ejs: Ejs
			},
			root: path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'routes/views'
			)
		});
		this.fastify.register(FastifyStatic, {
			root: path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'static'
			),
			prefix: '/static/'
		});
		this.fastify.register(FastifyCookie);
		this.fastify.register(FastifySession, {
			secret: this.config.secret,
			cookie: {
				maxAge: 15 * MINUTE
			},
			store: new TypeormStore({
				ttl: 15 * MINUTE,
				onError: (store, error) => {
					this.logger.error('Session error: ' + error.toString());
				}
			}).connect(this.datasource.getRepository(Session)),
			rolling: true
		});
		this.fastify.register(FastifyFormBody);
	}

	private getFastifyLogger() {
		const processMessage = (msg: any) => {
			if (typeof msg == 'string') {
				return { message: msg };
			} else {
				return {
					message: 'HTTP Request',
					..._.omit(msg, ['req', 'res']),
					id: msg.req?.id,
					params: msg.req?.params,
					query: msg.req?.query
				};
			}
		};

		return {
			level: this.logger.level,
			fatal: (msg: any) =>
				this.logger.log({ level: 'error', ...processMessage(msg) }),
			error: (msg: any) =>
				this.logger.log({ level: 'error', ...processMessage(msg) }),
			warn: (msg: any) =>
				this.logger.log({ level: 'warn', ...processMessage(msg) }),
			info: (msg: any) =>
				this.logger.log({ level: 'info', ...processMessage(msg) }),
			debug: (msg: any) =>
				this.logger.log({ level: 'debug', ...processMessage(msg) }),
			trace: (msg: any) =>
				this.logger.log({ level: 'trace', ...processMessage(msg) }),
			child: () => this.getFastifyLogger()
		};
	}

	public async initialize() {
		this.logger.info('Initializing WebServer');

		this.logger.debug('Registering routes');
		for (const route of Object.values(routes)) {
			await this.fastify.register(route, {
				logger: this.logger,
				db: this.datasource,
				tokens: this.tokens,
				adminPassword: this.config.adminPassword
			});
		}

		this.logger.debug('Start listening');
		await this.fastify.listen({ port: this.config.port });

		this.logger.info('Ready to respond to requests', {
			port: this.config.port
		});
	}

	public async destroy() {
		this.logger.info('Stopping WebServer');
		await this.fastify.close();
	}
}

export default WebServer;

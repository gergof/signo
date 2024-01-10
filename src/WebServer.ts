import path from 'path';
import { fileURLToPath } from 'url';

import FastifyCookie from '@fastify/cookie';
import FastifyFormBody from '@fastify/formbody';
import FastifyMultipart from '@fastify/multipart';
import FastifySession from '@fastify/session';
import FastifyStatic from '@fastify/static';
import FastifyView from '@fastify/view';
import { TypeormStore } from 'connect-typeorm';
import Ejs from 'ejs';
import Fastify from 'fastify';
import { DataSource } from 'typeorm';

import { ChildLogger } from './Logger.js';
import NonceValidator from './NoneValidator.js';
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

	private nonceValidator: NonceValidator;

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

		this.nonceValidator = new NonceValidator(300);

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
		this.fastify.register(FastifyMultipart, {
			limits: {
				files: 1,
				fileSize: 200 * 1024 * 1024 // 200 MiB
			}
		});
	}

	private getFastifyLogger() {
		const processMessage = (msg: any) => {
			if (typeof msg == 'string') {
				return { message: msg };
			} else {
				if (msg.err && this.logger.level == 'debug') {
					// eslint-disable-next-line
					console.log(msg.err);
				}
				return {
					message: msg.req
						? `${msg.req.method} ${msg.req.url}`
						: msg.res
							? `HTTP Response ${msg.res.statusCode} ${msg.res.raw.statusMessage}`
							: 'Error',
					...(msg.req
						? {
								id: msg.req.id,
								params: msg.req.params,
								query: msg.req.query
							}
						: msg.res
							? {
									id: msg.res.request.id,
									responseTime: msg.responseTime
								}
							: {}),
					...(msg.err
						? {
								err: msg.err.toString()
							}
						: {})
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
				this.logger.log({ level: 'debug', ...processMessage(msg) }),
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
				adminPassword: this.config.adminPassword,
				nonceValidator: this.nonceValidator
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

import { FastifyPluginAsync } from 'fastify';
import { DataSource } from 'typeorm';

import { ChildLogger } from '../Logger.js';
import NonceValidator from '../NoneValidator.js';
import Tokens from '../Tokens.js';

export interface RouteCtx {
	logger: ChildLogger;
	db: DataSource;
	tokens: Tokens;
	adminPassword: string;
	nonceValidator: NonceValidator;
}

type Route = FastifyPluginAsync<RouteCtx>;

export default Route;

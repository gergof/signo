import { FastifyPluginAsync } from 'fastify';
import { DataSource } from 'typeorm';

import { ChildLogger } from '../Logger.js';

export interface RouteCtx {
	logger: ChildLogger;
	db: DataSource;
}

type Route = FastifyPluginAsync<RouteCtx>;

export default Route;

import User from './models/User.js';

declare module 'fastify' {
	interface Session {
		user?: User;
	}
}

import { Static, Type } from '@sinclair/typebox';
import * as bcrypt from 'bcrypt';

import User from '../models/User.js';

import Route from './Route.js';

const LoginBody = Type.Object({
	username: Type.String(),
	password: Type.String()
});
type LoginBodyType = Static<typeof LoginBody>;

const LoginQuery = Type.Object({
	redirect: Type.Optional(Type.String())
});
type LoginQueryType = Static<typeof LoginQuery>;

const AuthRoute: Route = async (fastify, ctx) => {
	fastify.get('/auth/login', async (req, resp) => {
		if (req.session.get('user')) {
			return resp.redirect('/');
		}

		return resp.view('login.ejs', { user: undefined });
	});

	fastify.post<{ Body: LoginBodyType; Querystring: LoginQueryType }>(
		'/auth/login',
		{
			schema: {
				body: LoginBody,
				querystring: LoginQuery
			}
		},
		async (req, resp) => {
			if (req.session.get('user')) {
				return resp.redirect('/');
			}

			let authUser: User | null = null;
			if (req.body.username == 'admin') {
				// authenticate using config realm
				if (
					await bcrypt.compare(req.body.password, ctx.adminPassword)
				) {
					authUser = {
						id: -1,
						username: 'admin',
						name: 'Administrator',
						active: true,
						password: ''
					};
				}
			} else {
				const user = await ctx.db
					.getRepository(User)
					.findOneBy({ username: req.body.username, active: true });
				if (user) {
					if (
						await bcrypt.compare(req.body.password, user.password)
					) {
						authUser = user;
					}
				}
			}

			if (authUser) {
				req.session.set('user', authUser);
				await req.session.save();
				return resp.redirect(
					req.query.redirect ? req.query.redirect : '/'
				);
			}

			return resp
				.view('login.ejs', {
					user: undefined,
					error: 'Wrong username or password'
				})
				.code(401);
		}
	);

	fastify.get('/auth/logout', async (req, resp) => {
		await req.session.destroy();

		return resp.redirect('/');
	});
};

export default AuthRoute;

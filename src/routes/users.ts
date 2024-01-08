import { Static, Type } from '@sinclair/typebox';
import * as bcrypt from 'bcrypt';
import httpErrors from 'http-errors';
import owaspPasswordStrengthTest from 'owasp-password-strength-test';

import User from '../models/User.js';

import Route from './Route.js';
import authGuard from './helpers/authGuard.js';

const AddBody = Type.Object({
	username: Type.String(),
	name: Type.String(),
	password: Type.String(),
	passwordConf: Type.String()
});
type AddBodyType = Static<typeof AddBody>;

const EditParams = Type.Object({
	id: Type.Integer()
});
type EditParamsType = Static<typeof EditParams>;

const ChangeActiveQuery = Type.Object({
	active: Type.Boolean()
});
type ChangeActiveQueryType = Static<typeof ChangeActiveQuery>;

const EditBody = Type.Object({
	name: Type.String(),
	password: Type.Optional(Type.String()),
	passwordConf: Type.Optional(Type.String())
});
type EditBodyType = Static<typeof EditBody>;

const UsersRoute: Route = async (fastify, ctx) => {
	fastify.get('/users', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		const users = await ctx.db.getRepository(User).find();

		return resp.view('users/index.ejs', {
			user: req.session.get('user'),
			users
		});
	});

	fastify.get('/users/add', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		return resp.view('users/add.ejs', { user: req.session.get('user') });
	});

	fastify.post<{ Body: AddBodyType }>(
		'/users/add',
		{
			schema: {
				body: AddBody
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Users = ctx.db.getRepository(User);

			if ((await Users.countBy({ username: req.body.username })) > 0) {
				return resp.view('users/add.ejs', {
					user: req.session.get('user'),
					error: 'User with username already exists',
					values: req.body
				});
			}

			if (req.body.password != req.body.passwordConf) {
				return resp.view('users/add.ejs', {
					user: req.session.get('user'),
					error: "Passwords don't match",
					values: req.body
				});
			}

			const passwordStrength = owaspPasswordStrengthTest.test(
				req.body.password
			);
			if (!passwordStrength.strong) {
				return resp.view('users/add.ejs', {
					user: req.session.get('user'),
					error: passwordStrength.errors.join(' '),
					values: req.body
				});
			}

			const user = Users.create({
				username: req.body.username,
				name: req.body.name,
				active: true,
				password: await bcrypt.hash(req.body.password, 10)
			});

			await Users.save(user);

			return resp.redirect('/users');
		}
	);

	fastify.get<{ Params: EditParamsType; Querystring: ChangeActiveQueryType }>(
		'/users/change-active/:id',
		{
			schema: {
				params: EditParams,
				querystring: ChangeActiveQuery
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Users = ctx.db.getRepository(User);

			const user = await Users.findOneById(req.params.id);

			if (!user) {
				throw new httpErrors.BadRequest('User not found');
			}

			user.active = req.query.active;

			await Users.save(user);

			return resp.redirect('/users');
		}
	);

	fastify.get<{ Params: EditParamsType }>(
		'/users/edit/:id',
		{
			schema: {
				params: EditParams
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Users = ctx.db.getRepository(User);

			const user = await Users.findOneById(req.params.id);

			if (!user) {
				throw new httpErrors.BadRequest('User not found');
			}

			return resp.view('users/edit.ejs', {
				user: req.session.get('user'),
				editUser: user
			});
		}
	);

	fastify.post<{ Params: EditParamsType; Body: EditBodyType }>(
		'/users/edit/:id',
		{
			schema: {
				params: EditParams,
				body: EditBody
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Users = ctx.db.getRepository(User);

			const user = await Users.findOneById(req.params.id);

			if (!user) {
				throw new httpErrors.BadRequest('User not found');
			}

			user.name = req.body.name;

			if (req.body.password && req.body.password != '') {
				if (req.body.password != req.body.passwordConf) {
					return resp.view('users/edit.ejs', {
						user: req.session.get('user'),
						error: "Passwords don't match",
						editUser: user
					});
				}

				const passwordStrength = owaspPasswordStrengthTest.test(
					req.body.password
				);
				if (!passwordStrength.strong) {
					return resp.view('users/edit.ejs', {
						user: req.session.get('user'),
						error: passwordStrength.errors.join(' '),
						editUser: user
					});
				}

				user.password = await bcrypt.hash(req.body.password, 10);
			}

			await Users.save(user);

			return resp.redirect('/users');
		}
	);
};

export default UsersRoute;

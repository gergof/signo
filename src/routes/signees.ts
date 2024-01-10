import { Static, Type } from '@sinclair/typebox';
import httpErrors from 'http-errors';

import Engine from '../models/Engine.js';
import Signee from '../models/Signee.js';
import generateHmacSecret from '../utils/generateHmacSecret.js';

import Route from './Route.js';
import authGuard from './helpers/authGuard.js';

const IdParams = Type.Object({
	id: Type.String()
});
type IdParamsType = Static<typeof IdParams>;

const AddBody = Type.Object({
	name: Type.String()
});
type AddBodyType = Static<typeof AddBody>;

const ChangeActiveQuery = Type.Object({
	active: Type.Boolean()
});
type ChangeActiveQueryType = Static<typeof ChangeActiveQuery>;

const EditEngineQuery = Type.Object({
	engine: Type.Integer(),
	enabled: Type.Boolean()
});
type EditEngineQueryType = Static<typeof EditEngineQuery>;

const SigneesRoute: Route = async (fastify, ctx) => {
	fastify.get('/signees', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		const signees = await ctx.db.getRepository(Signee).find();

		return resp.view('signees/index.ejs', {
			user: req.session.get('user'),
			signees
		});
	});

	fastify.get('/signees/add', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		return resp.view('signees/add.ejs', {
			user: req.session.get('user')
		});
	});

	fastify.post<{ Body: AddBodyType }>(
		'/signees/add',
		{ schema: { body: AddBody } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Signees = ctx.db.getRepository(Signee);

			const signee = Signees.create({
				name: req.body.name,
				active: true,
				hmacSecret: generateHmacSecret()
			});

			await Signees.save(signee);

			return resp.redirect(`/signees/${signee.id}/rotate-secret`);
		}
	);

	fastify.get<{ Params: IdParamsType; Querystring: ChangeActiveQueryType }>(
		'/signees/:id/change-active',
		{
			schema: {
				params: IdParams,
				querystring: ChangeActiveQuery
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Signees = ctx.db.getRepository(Signee);

			const signee = await Signees.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			signee.active = req.query.active;

			await Signees.save(signee);

			return resp.redirect('/signees');
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/signees/:id/edit',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const signee = await ctx.db
				.getRepository(Signee)
				.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			return resp.view('signees/edit.ejs', {
				user: req.session.get('user'),
				signee
			});
		}
	);

	fastify.post<{ Params: IdParamsType; Body: AddBodyType }>(
		'/signees/:id/edit',
		{ schema: { params: IdParams, body: AddBody } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Signees = ctx.db.getRepository(Signee);

			const signee = await Signees.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			signee.name = req.body.name;

			await Signees.save(signee);

			return resp.redirect('/signees');
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/signees/:id',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const signee = await ctx.db
				.getRepository(Signee)
				.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			const engines = await ctx.db.getRepository(Engine).find();

			return resp.view('signees/details.ejs', {
				user: req.session.get('user'),
				signee,
				engines,
				enabledEngines: signee.engines.map(engine => engine.id)
			});
		}
	);

	fastify.get<{ Params: IdParamsType; Querystring: EditEngineQueryType }>(
		'/signees/:id/edit-engine',
		{
			schema: {
				params: IdParams,
				querystring: EditEngineQuery
			}
		},
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Signees = ctx.db.getRepository(Signee);

			const signee = await Signees.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			const engines = await ctx.db.getRepository(Engine).find();
			const engineToModify = engines.find(
				engine => engine.id == req.query.engine
			);

			if (!engineToModify) {
				throw new httpErrors.BadRequest('Engine does not exist');
			}

			if (req.query.enabled) {
				signee.engines = [
					...signee.engines.filter(
						engine => engine.id != engineToModify.id
					),
					engineToModify
				];
			} else {
				signee.engines = signee.engines.filter(
					engine => engine.id != engineToModify.id
				);
			}

			await Signees.save(signee);

			return resp.redirect(`/signees/${signee.id}`);
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/signees/:id/rotate-secret',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const signee = await ctx.db
				.getRepository(Signee)
				.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			return resp.view('signees/rotateSecret.ejs', {
				user: req.session.get('user'),
				signee
			});
		}
	);

	fastify.post<{ Params: IdParamsType }>(
		'/signees/:id/rotate-secret',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Signees = ctx.db.getRepository(Signee);

			const signee = await Signees.findOneById(req.params.id);

			if (!signee) {
				throw new httpErrors.NotFound('Signee not found');
			}

			signee.hmacSecret = generateHmacSecret();

			await Signees.save(signee);

			return resp.view('signees/rotateSecret.ejs', {
				user: req.session.get('user'),
				signee,
				secret: signee.hmacSecret
			});
		}
	);
};

export default SigneesRoute;

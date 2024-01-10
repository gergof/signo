import { Static, Type } from '@sinclair/typebox';
import httpErrors from 'http-errors';
import _ from 'lodash';

import SigningEngines, { SigningEngineType } from '../engines/index.js';
import Engine from '../models/Engine.js';

import Route from './Route.js';
import authGuard from './helpers/authGuard.js';

const AddBody = Type.Object({
	type: Type.Enum(SigningEngineType),
	name: Type.String(),
	token: Type.String(),
	slot: Type.String(),
	mechanism: Type.String()
});
type AddBodyType = Static<typeof AddBody>;

const IdParams = Type.Object({
	id: Type.Number()
});
type IdParamsType = Static<typeof IdParams>;

const ChangeActiveQuery = Type.Object({
	active: Type.Boolean()
});
type ChangeActiveQueryType = Static<typeof ChangeActiveQuery>;

const EnginesRoute: Route = async (fastify, ctx) => {
	fastify.get('/engines', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		const engines = await ctx.db.getRepository(Engine).find();

		return resp.view('engines/index.ejs', {
			user: req.session.get('user'),
			engines: engines.map(engine => {
				const token = ctx.tokens.getToken(engine.tokenId);

				return {
					...engine,
					tokenPresent: !!token,
					tokenActive: token?.isActivated() || false
				};
			})
		});
	});

	fastify.get('/engines/add', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		return resp.view('engines/add.ejs', {
			user: req.session.get('user'),
			types: Object.keys(SigningEngines),
			tokens: ctx.tokens.getTokens().map(token => token.tokenId),
			mechanisms: _.sortBy(
				_.uniq(
					ctx.tokens.getTokens().reduce((acc, cur) => {
						return [...acc, ...cur.getSigningMechanisms()];
					}, [] as string[])
				)
			)
		});
	});

	fastify.post<{ Body: AddBodyType }>(
		'/engines/add',
		{ schema: { body: AddBody } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			if (!ctx.tokens.getTokenIds().includes(req.body.token)) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					values: req.body,
					error: 'Token does not exist'
				});
			}

			if (!/^[0-9a-fA-F]+$/.test(req.body.slot)) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					values: req.body,
					error: 'Slot is not in hexadecimal'
				});
			}

			if (
				!ctx.tokens
					.getToken(req.body.token)
					?.getSigningMechanisms()
					.includes(req.body.mechanism)
			) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					values: req.body,
					error: `Token does not support ${req.body.mechanism} mechanism for signing`
				});
			}

			const Engines = ctx.db.getRepository(Engine);

			const engine = Engines.create({
				type: req.body.type,
				name: req.body.name,
				active: true,
				tokenId: req.body.token,
				tokenSlot: req.body.slot,
				mechanism: req.body.mechanism
			});

			await Engines.save(engine);

			return resp.redirect('/engines');
		}
	);

	fastify.get<{ Params: IdParamsType; Querystring: ChangeActiveQueryType }>(
		'/engines/change-active/:id',
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

			const Engines = ctx.db.getRepository(Engine);

			const engine = await Engines.findOneById(req.params.id);

			if (!engine) {
				throw new httpErrors.NotFound('Engine not found');
			}

			engine.active = req.query.active;

			await Engines.save(engine);

			return resp.redirect('/engines');
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/engines/edit/:id',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const engine = await ctx.db
				.getRepository(Engine)
				.findOneById(req.params.id);

			if (!engine) {
				throw new httpErrors.NotFound('Engine not found');
			}

			return resp.view('engines/edit.ejs', {
				user: req.session.get('user'),
				types: Object.keys(SigningEngines),
				tokens: ctx.tokens.getTokens().map(token => token.tokenId),
				mechanisms: _.sortBy(
					_.uniq(
						ctx.tokens.getTokens().reduce((acc, cur) => {
							return [...acc, ...cur.getSigningMechanisms()];
						}, [] as string[])
					)
				),
				engine
			});
		}
	);

	fastify.post<{ Params: IdParamsType; Body: AddBodyType }>(
		'/engines/edit/:id',
		{ schema: { params: IdParams, body: AddBody } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const Engines = ctx.db.getRepository(Engine);

			const engine = await Engines.findOneById(req.params.id);

			if (!engine) {
				throw new httpErrors.NotFound('Engine not found');
			}

			if (!ctx.tokens.getTokenIds().includes(req.body.token)) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					error: 'Token does not exist',
					engine
				});
			}

			if (!/^[0-9a-fA-F]+$/.test(req.body.slot)) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					error: 'Slot is not in hexadecimal',
					engine
				});
			}

			if (
				!ctx.tokens
					.getToken(req.body.token)
					?.getSigningMechanisms()
					.includes(req.body.mechanism)
			) {
				return resp.view('engines/add.ejs', {
					user: req.session.get('user'),
					types: Object.keys(SigningEngines),
					tokens: ctx.tokens.getTokens().map(token => token.tokenId),
					mechanisms: _.sortBy(
						_.uniq(
							ctx.tokens.getTokens().reduce((acc, cur) => {
								return [...acc, ...cur.getSigningMechanisms()];
							}, [] as string[])
						)
					),
					error: `Token does not support ${req.body.mechanism} mechanism for signing`,
					engine
				});
			}

			engine.type = req.body.type;
			engine.name = req.body.name;
			engine.tokenId = req.body.token;
			engine.tokenSlot = req.body.slot;
			engine.mechanism = req.body.mechanism;

			await Engines.save(engine);

			return resp.redirect('/engines');
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/engines/sign/:id',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const engine = await ctx.db
				.getRepository(Engine)
				.findOneById(req.params.id);

			if (!engine) {
				throw new httpErrors.NotFound('Signing engine not found');
			}

			if (!engine.active) {
				throw new httpErrors.BadRequest(
					'Can not sign with inactive signing engine'
				);
			}

			const token = ctx.tokens.getToken(engine.tokenId);

			if (!token || !token.isActivated()) {
				throw new httpErrors.BadRequest(
					'Token is not present or is not activated'
				);
			}

			return resp.view('engines/sign.ejs', {
				user: req.session.get('user'),
				engine
			});
		}
	);

	fastify.post<{ Params: IdParamsType }>(
		'/engines/sign/:id',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const engine = await ctx.db
				.getRepository(Engine)
				.findOneById(req.params.id);

			if (!engine) {
				throw new httpErrors.NotFound('Signing engine not found');
			}

			if (!engine.active) {
				throw new httpErrors.BadRequest(
					'Can not sign with inactive signing engine'
				);
			}

			const token = ctx.tokens.getToken(engine.tokenId);

			if (!token || !token.isActivated()) {
				throw new httpErrors.BadRequest(
					'Token is not present or is not activated'
				);
			}

			const data = await req.file();

			if (!data) {
				throw new httpErrors.BadRequest(
					'File is missing from multipart upload'
				);
			}

			const sign = ctx.tokens.createSigningEngine(
				engine.type,
				engine.tokenId,
				engine.tokenSlot
			);

			const signature = sign.supportsStream()
				? await sign.signStream(data.file, engine.mechanism)
				: await sign.sign(await data.toBuffer(), engine.mechanism);

			return resp
				.header(
					'content-disposition',
					`attachment; filename=${encodeURIComponent(
						data.filename
					)}.sig`
				)
				.send(signature)
				.type('application/octet-stream')
				.code(200);
		}
	);
};

export default EnginesRoute;

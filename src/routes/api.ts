import crypto from 'crypto';

import { Static, Type } from '@sinclair/typebox';
import httpErrors from 'http-errors';

import Route from './Route.js';
import apiAuthGuard from './helpers/apiAuthGuard.js';

const SignParams = Type.Object({
	engine: Type.Integer()
});
type SignParamsType = Static<typeof SignParams>;

const ApiRoute: Route = async (fastify, ctx) => {
	fastify.post<{ Params: SignParamsType }>(
		'/api/sign/:engine',
		{ schema: { params: SignParams } },
		async (req, resp) => {
			const data = await req.file();

			if (!data) {
				throw new httpErrors.BadRequest('File is missing');
			}

			const file = await data.toBuffer();
			const fileHash = crypto
				.createHash('sha3-512')
				.update(file)
				.digest('hex');

			const signee = await apiAuthGuard(req, resp, ctx, fileHash);

			const engine = signee.engines.find(
				engine => engine.id == req.params.engine
			);

			if (!engine || !engine.active) {
				throw new httpErrors.BadRequest(
					'Engine is not allowed for this signee'
				);
			}

			const token = ctx.tokens.getToken(engine.tokenId);

			if (!token || !token.isActivated()) {
				throw new httpErrors.Forbidden('Token is not activated');
			}

			const sign = ctx.tokens.createSigningEngine(
				engine.type,
				engine.tokenId,
				engine.tokenSlot
			);

			const signature = await sign.sign(file, engine.mechanism);

			return resp
				.send(signature)
				.type('application/octet-stream')
				.code(200);
		}
	);
};

export default ApiRoute;

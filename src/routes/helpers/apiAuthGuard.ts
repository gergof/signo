import hmac from '@opsvent/hmac';
import { FastifyRequest, FastifyReply } from 'fastify';
import httpErrors from 'http-errors';

import Signee from '../../models/Signee.js';
import { RouteCtx } from '../Route.js';

const apiAuthGuard = async (
	req: FastifyRequest,
	resp: FastifyReply,
	ctx: RouteCtx,
	body: string
) => {
	try {
		const sig = req.headers.authorization;

		if (!sig) {
			throw new httpErrors.Unauthorized('Authorization header missing');
		}

		const signee = await ctx.db.getRepository(Signee).findOneBy({
			id: parseInt(hmac.getKeyIdFromSignature(sig)),
			active: true
		});

		if (!signee) {
			throw new Error('Invalid client');
		}

		const nonce = hmac.verify(
			sig,
			{
				method: req.method,
				url: req.url,
				body: body,
				timeWindow: 300
			},
			{
				id: signee.id.toString(),
				key: signee.hmacSecret
			}
		);

		ctx.nonceValidator.validate(nonce);

		return signee;
	} catch (e: any) {
		ctx.logger.info('Unauthorized API request', {
			reason: e?.toString() || e?.message || 'Unknown error'
		});

		throw new httpErrors.Unauthorized(e?.message);
	}
};

export default apiAuthGuard;

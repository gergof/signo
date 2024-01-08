import { FastifyRequest, FastifyReply } from 'fastify';

const authGuard = (req: FastifyRequest, resp: FastifyReply) => {
	if (req.session.get('user')) {
		// authenticated
		return;
	}

	return resp.redirect('/auth/login?redirect=' + encodeURI(req.url));
};

export default authGuard;

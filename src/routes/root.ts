import Route from './Route.js';

const RootRoute: Route = async fastify => {
	fastify.get('/', async (req, resp) => {
		return resp.view('index.ejs', { user: req.session.get('user') });
	});
};

export default RootRoute;

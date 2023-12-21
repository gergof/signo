import Route from './Route.js';

const RootRoute: Route = async (fastify, ctx) => {
	fastify.get('/', async (req, resp) => {
		return resp.view('index.ejs');
	});
};

export default RootRoute;

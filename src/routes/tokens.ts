import { Static, Type } from '@sinclair/typebox';
import * as pkcs11 from 'graphene-pk11';
import httpErrors from 'http-errors';

import getKeyTypeString from '../utils/getKeyTypeString.js';

import Route from './Route.js';
import authGuard from './helpers/authGuard.js';

const IdParams = Type.Object({
	id: Type.String()
});
type IdParamsType = Static<typeof IdParams>;

const ActivateBody = Type.Object({
	pin: Type.String()
});
type ActivateBodyType = Static<typeof ActivateBody>;

const TokensRoute: Route = async (fastify, ctx) => {
	fastify.get('/tokens', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		return resp.view('tokens/index.ejs', {
			user: req.session.get('user'),
			tokens: ctx.tokens.getTokens().map(token => ({
				id: token.tokenId,
				description: token.slot.slotDescription,
				serialNumber: token.slot.getToken().serialNumber,
				activated: token.isActivated()
			}))
		});
	});

	fastify.get('/tokens/reload', async (req, resp) => {
		if (authGuard(req, resp)) {
			return resp.send();
		}

		ctx.tokens.loadTokens();

		return resp.redirect('/tokens');
	});

	fastify.get<{ Params: IdParamsType }>(
		'/tokens/:id',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const token = ctx.tokens.getToken(req.params.id);
			if (!token) {
				throw new httpErrors.NotFound(
					`No token exists with id ${req.params.id}. Try reloading tokens.`
				);
			}

			const session = token.getSession();
			const objs = Array.from(session.find()).map(obj => obj.toType());

			return resp.view('tokens/details.ejs', {
				user: req.session.get('user'),
				token: {
					id: token.tokenId,
					slot: {
						description: token.slot.slotDescription,
						manufacturer: token.slot.manufacturerID,
						isHardware: token.slot.flags & pkcs11.SlotFlag.HW_SLOT,
						isRemovable:
							token.slot.flags & pkcs11.SlotFlag.REMOVABLE_DEVICE,
						isInitialized:
							token.slot.flags & pkcs11.SlotFlag.TOKEN_PRESENT,
						hardwareVersion: `${token.slot.hardwareVersion.major}.${token.slot.hardwareVersion.minor}`,
						firmwareVersion: `${token.slot.firmwareVersion.major}.${token.slot.firmwareVersion.minor}`
					},
					token: {
						label: token.slot.getToken().label,
						manufacturer: token.slot.getToken().manufacturerID,
						model: token.slot.getToken().model,
						serialNumber: token.slot.getToken().serialNumber,
						maxSessionCount: token.slot.getToken().maxSessionCount,
						sessionCount: token.slot.getToken().sessionCount,
						maxRwSessionCount:
							token.slot.getToken().maxRwSessionCount,
						rwSessionCount: token.slot.getToken().rwSessionCount,
						minPinLength: token.slot.getToken().minPinLen,
						maxPinLength: token.slot.getToken().maxPinLen,
						totalPublicMemory:
							token.slot.getToken().totalPublicMemory,
						freePublicMemory:
							token.slot.getToken().freePublicMemory,
						totalPrivateMemory:
							token.slot.getToken().totalPrivateMemory,
						freePrivateMemory:
							token.slot.getToken().freePrivateMemory,
						hardwareVersion: `${
							token.slot.getToken().hardwareVersion.major
						}.${token.slot.getToken().hardwareVersion.minor}`,
						firmwareVersion: `${
							token.slot.getToken().firmwareVersion.major
						}.${token.slot.getToken().firmwareVersion.minor}`,
						utcTime: token.slot.getToken().utcTime
					},
					keys: (
						objs.filter(obj =>
							['PublicKey', 'PrivateKey'].includes(
								obj.constructor.name
							)
						) as (pkcs11.PublicKey | pkcs11.PrivateKey)[]
					).map(key => ({
						id: key.id.readInt8(),
						private: key.constructor.name == 'PrivateKey',
						algo: getKeyTypeString(key.type),
						local: key.local
					}))
				}
			});
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/tokens/:id/activate',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const token = ctx.tokens.getToken(req.params.id);
			if (!token) {
				throw new httpErrors.NotFound(
					`No token exists with id ${req.params.id}. Try reloading tokens.`
				);
			}

			return resp.view('tokens/activate.ejs', {
				user: req.session.get('user'),
				tokenId: token.tokenId
			});
		}
	);

	fastify.post<{ Params: IdParamsType; Body: ActivateBodyType }>(
		'/tokens/:id/activate',
		{ schema: { params: IdParams, body: ActivateBody } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const token = ctx.tokens.getToken(req.params.id);
			if (!token) {
				throw new httpErrors.NotFound(
					`No token exists with id ${req.params.id}. Try reloading tokens.`
				);
			}

			try {
				token.activate(req.body.pin);
				return resp.redirect('/tokens');
			} catch (e: any) {
				return resp.view('tokens/activate.ejs', {
					user: req.session.get('user'),
					tokenId: token.tokenId,
					error:
						'Failed to activate token: ' +
						(e.toString() || 'Unknown error')
				});
			}
		}
	);

	fastify.get<{ Params: IdParamsType }>(
		'/tokens/:id/deactivate',
		{ schema: { params: IdParams } },
		async (req, resp) => {
			if (authGuard(req, resp)) {
				return resp.send();
			}

			const token = ctx.tokens.getToken(req.params.id);
			if (!token) {
				throw new httpErrors.NotFound(
					`No token exists with id ${req.params.id}. Try reloading tokens.`
				);
			}

			token.deactivate();

			return resp.redirect('/tokens');
		}
	);
};

export default TokensRoute;

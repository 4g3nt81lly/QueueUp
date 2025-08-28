import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import User from '~/schemas/User';
import { ACCESS_TOKEN_SECRET } from '~/shared/environment';
import Patterns from '~/shared/patterns';
import type { RouterMiddleware } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';

export const authenticateUser: RouterMiddleware = async (request, response, next) => {
	const accessTokenMatch = request.headers.authorization?.match(
		Patterns.AUTHORIZATION_HEADER
	);
	if (accessTokenMatch === undefined) {
		response.status(StatusCodes.BAD_REQUEST);
		throw new UnauthorizedRequestError('Missing user credentials.');
	}
	if (accessTokenMatch === null) {
		response.status(StatusCodes.BAD_REQUEST);
		throw new UnauthorizedRequestError('Invalid authorization header.');
	}
	const { token } = accessTokenMatch.groups!;
	const decodedPayload = jwt.verify(token, ACCESS_TOKEN_SECRET);
	if (
		typeof decodedPayload === 'string' ||
		typeof decodedPayload.id !== 'string' ||
		typeof decodedPayload.username !== 'string'
	) {
		console.error(`🎩 Unauthorized access attempted, token: ${token}`);
		response.status(StatusCodes.UNAUTHORIZED);
		throw new UnauthorizedRequestError('Invalid user credentials.');
	}
	const { id, username } = decodedPayload;
	let userExists = null;
	try {
		userExists = await User.exists({ _id: id, name: username }).exec();
	} catch (error: any) {
		console.error(`Failed to verify user: ${error.message}`);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
	if (userExists === null) {
		console.error(`🎩 Unauthorized access attempted, token: ${token}`);
		response.status(StatusCodes.UNAUTHORIZED);
		throw new UnauthorizedRequestError();
	}
	// Pass user info downstream using locals
	response.locals.user = <AuthUserInfo>{ id, username };
	next();
};

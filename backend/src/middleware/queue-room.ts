import { StatusCodes } from 'http-status-codes';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { NotFoundError } from '~/errors/server';
import QueueRoom from '~/schemas/queues/QueueRoom';
import type { RouterMiddleware } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';

export const verifyQueueRoom: RouterMiddleware = async (request, response, next) => {
	const { id: userId }: AuthUserInfo = response.locals.user;
	const { id: queueRoomId } = request.body;
	if (typeof queueRoomId !== 'string') {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Missing queue room ID.');
	}
	const queueRoom = await QueueRoom.findById(queueRoomId).select('user').exec();
	if (queueRoom === null) {
		response.status(StatusCodes.NOT_FOUND);
		throw new NotFoundError();
	}
	// Verify if the user matches the authentication payload
	if (queueRoom.user.toHexString() !== userId) {
		response.status(StatusCodes.UNAUTHORIZED);
		throw new UnauthorizedRequestError();
	}
	// NOTE: Could also pass queueRoom (without select) downstream to handlers
	next();
};

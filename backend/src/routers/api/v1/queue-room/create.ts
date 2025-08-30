import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import QueueRoom from '~/schemas/queues/QueueRoom';
import Constants from '~/shared/constants';
import type { RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';
import { generateQueueRoomCode } from '~/utils/helpers';

const handleCreate: RouterRequestHandler = async (request, response) => {
	const { id: userId }: AuthUserInfo = response.locals.user;
	let newQueueRoom;
	try {
		newQueueRoom = await mongoose.connection.transaction(async function (session) {
			// TODO: Test cases where payloads have reserved keys (e.g. createdAt, updatedAt)
			const { _id: _, ...queueRoomInfo } = request.body;
			newQueueRoom = new QueueRoom(queueRoomInfo);
			// Verify if the user matches the authentication payload
			if (newQueueRoom.user.toHexString() !== userId) {
				response.status(StatusCodes.UNAUTHORIZED);
				throw new UnauthorizedRequestError();
			}
			// Re-generate join code to ensure uniqueness
			// TODO: Handle the case where no more join code is available
			let shouldRegenerate = true;
			while (shouldRegenerate) {
				newQueueRoom.code = generateQueueRoomCode();
				try {
					await newQueueRoom.save({ session });
					shouldRegenerate = false;
				} catch (error: any) {
					if (error.code !== Constants.MONGO_DUPLICATE_KEY_ERROR) {
						throw error;
					}
				}
			}
			return newQueueRoom;
		});
	} catch (error) {
		if (error instanceof BaseError) {
			throw error;
		} else if (error instanceof mongoose.Error.ValidationError) {
			response.status(StatusCodes.UNPROCESSABLE_ENTITY);
			const message = Object.values(error.errors)[0]?.message;
			throw new InvalidRequestError(message);
		}
		console.error(error);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
	response.status(StatusCodes.CREATED);
	return {
		message: `Successfully created a queue room with name "${newQueueRoom.name}".`,
		data: newQueueRoom.toData(),
	};
};

export default handleCreate;

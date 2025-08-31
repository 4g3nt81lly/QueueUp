import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose, { type RootFilterQuery } from 'mongoose';
import BaseError from '~/errors/base';
import {
	InvalidRequestError,
	NoOperationError,
	UnauthorizedRequestError,
} from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import { authenticateUser, getAuthenticationPayload } from '~/middleware/auth';
import { validateQueueRoom } from '~/middleware/queue-room';
import QueueEntry, { type IQueueEntrySchema } from '~/schemas/queues/QueueEntry';
import QueueRoom from '~/schemas/queues/QueueRoom';
import type { RouterRequestHandler } from '~/types/api';

const handleLeave: RouterRequestHandler = async (request, response) => {
	const { id: roomId } = request.body;
	if (typeof roomId !== 'string') {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Missing queue ID.');
	}
	const payload = getAuthenticationPayload(request, response);
	let tryTemporaryUser = false;
	try {
		await authenticateUser(payload, response);
		// The client is logged in
	} catch (error) {
		if (error instanceof UnauthorizedRequestError) {
			// The client is not logged in, authenticate using temporary access token
			tryTemporaryUser = true;
		} else {
			throw error;
		}
	}
	// Validate queue room only if client is logged in
	if (!tryTemporaryUser) {
		await validateQueueRoom(request, response, () => {});
	}
	return leaveRoom(roomId, payload, response, tryTemporaryUser);
};

async function leaveRoom(
	roomId: string,
	payload: ReturnType<typeof getAuthenticationPayload>,
	response: Response,
	tryTemporaryUser = false
) {
	let updatedQueueRoom;
	try {
		updatedQueueRoom = await mongoose.connection.transaction(async function (session) {
			const filter: RootFilterQuery<IQueueEntrySchema> = { roomId };
			if (tryTemporaryUser) {
				// Client not logged in, payload id is entry id and username is email
				filter._id = payload.id;
				filter.guestEmail = payload.username;
			} else {
				filter.guestUser = payload.id;
			}
			// prettier-ignore
			deleteEntryAndUpdateQueueRoom: {
				// Delete queue entry
				const deletedEntry = await QueueEntry.findOneAndDelete(filter, { session }).exec();
				if (deletedEntry === null) {
					break deleteEntryAndUpdateQueueRoom;
				}
				// Delete queue entries (skipped or not) from the room
				const updatedQueueRoom = await QueueRoom.findOneAndUpdate(
					{ _id: roomId },
					{
						$pull: {
							entries: deletedEntry._id,
							skippedEntries: deletedEntry._id,
						},
					},
					{ session, returnDocument: 'after' }
				).select('name').exec();
				if (updatedQueueRoom === null) {
					break deleteEntryAndUpdateQueueRoom;
				}
				return updatedQueueRoom;
			}
			response.status(StatusCodes.UNPROCESSABLE_ENTITY);
			throw new NoOperationError('You are not in the queue.');
		});
	} catch (error: any) {
		if (error instanceof BaseError) {
			throw error;
		}
		console.error('Failed to leave room:', error.message);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError(
			'An unexpected error occurred when leaving the queue. Please try again later!'
		);
	}
	return {
		message: `Successfully left the queue "${updatedQueueRoom.name}".`,
	};
}

export default handleLeave;

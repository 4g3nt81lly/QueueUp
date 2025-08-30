import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import QueueEntry from '~/schemas/queues/QueueEntry';
import QueueRoom from '~/schemas/queues/QueueRoom';
import type { RouterRequestHandler } from '~/types/api';

const handleDelete: RouterRequestHandler = async (request, response) => {
	const { id: queueRoomId } = request.body;
	try {
		await mongoose.connection.transaction(async function (session) {
			// Delete the queue room and retrieves entries, which locks the document before commit/abort
			// prettier-ignore
			const deletedQueueRoom = await QueueRoom
				.findByIdAndDelete(queueRoomId, { session })
				.exec();
			if (deletedQueueRoom === null) {
				// This could only happen if the client deletes the same room from another session
				response.status(StatusCodes.NOT_FOUND);
				throw new InternalServerError('Expected queue room deletion but none was found.');
			}

			// Delete all queue entries with the room id
			await QueueEntry.deleteMany({ roomId: deletedQueueRoom._id }, { session }).exec();

			// TODO: Notify all associated users about this deletion, if necessary
		});
	} catch (error) {
		if (error instanceof BaseError) {
			throw error;
		} else if (error instanceof mongoose.Error) {
			response.status(StatusCodes.UNPROCESSABLE_ENTITY);
			throw new InvalidRequestError(error.message);
		}
		console.error(error);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
	response.status(StatusCodes.OK);
	return {
		message: 'Successfully deleted queue room.',
		id: queueRoomId,
	};
};

export default handleDelete;

import { StatusCodes } from 'http-status-codes';
import mongoose, { type AnyBulkWriteOperation } from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError, NotFoundError } from '~/errors/server';
import { authenticateUser } from '~/middleware/auth';
import QueueEntry from '~/schemas/queues/QueueEntry';
import QueueRoom from '~/schemas/queues/QueueRoom';
import User from '~/schemas/User';
import Constants from '~/shared/constants';
import type { IRouter, RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';
import { generateQueueRoomCode } from '~/utils/helpers';

const handleCreate: RouterRequestHandler = async (request, response) => {
	const { id: userId }: AuthUserInfo = response.locals.user;
	try {
		const newQueueRoom = await mongoose.connection.transaction(async function (session) {
			const newQueueRoom = new QueueRoom(request.body);
			// Verify if the user matches the authentication payload
			if (newQueueRoom.user.toHexString() !== userId) {
				response.status(StatusCodes.UNAUTHORIZED);
				throw new UnauthorizedRequestError();
			}

			let savedQueueRoom = null;
			while (savedQueueRoom === null) {
				newQueueRoom.code = generateQueueRoomCode();
				try {
					savedQueueRoom = await newQueueRoom.save({ session });
				} catch (error: any) {
					if (error.code !== Constants.MONGO_DUPLICATE_KEY_ERROR) {
						throw error;
					}
				}
			}
			await User.findOneAndUpdate(
				{ _id: savedQueueRoom.user },
				{ $addToSet: { rooms: savedQueueRoom._id } },
				{ session, new: true }
			).exec();

			return savedQueueRoom.toJSON();
		});
		response.status(StatusCodes.CREATED);
		return newQueueRoom;
	} catch (error) {
		if (error instanceof BaseError) {
			throw error;
		} else if (error instanceof mongoose.Error.ValidationError) {
			response.status(StatusCodes.UNPROCESSABLE_ENTITY);
			const message = Object.values(error.errors)[0]?.message;
			throw new InvalidRequestError(message);
		}
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
};

const handleDelete: RouterRequestHandler = async (request, response) => {
	const { id: userId }: AuthUserInfo = response.locals.user;
	const { id: queueRoomId } = request.body;
	if (typeof queueRoomId !== 'string') {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Missing query room ID.');
	}
	try {
		await mongoose.connection.transaction(async function (session) {
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
			// Delete the queue room and retrieves entries, which locks the document before commit/abort
			const deletedQueueRoom = await QueueRoom.findByIdAndDelete(queueRoomId, { session })
				.select('entries skippedEntries')
				.exec();
			if (deletedQueueRoom === null) {
				// This could only happen if the client deletes the same room from another session
				response.status(StatusCodes.NOT_FOUND);
				throw new InternalServerError('Expected queue room deletion but none was found.');
			}

			// Delete all queue entries with the room id
			await QueueEntry.deleteMany({ roomId: deletedQueueRoom._id }, { session }).exec();

			// Using bulkWrite to perform batch updates to the users collection
			const writes: AnyBulkWriteOperation[] = [
				// Delete the queue room from the authenticated user
				{
					updateOne: {
						filter: { _id: userId },
						update: { $pull: { rooms: deletedQueueRoom._id } },
					},
				},
			];
			const deletedEntries = [
				...deletedQueueRoom.entries,
				...deletedQueueRoom.skippedEntries,
			];
			if (deletedEntries.length > 0) {
				// Delete queue entries from users where the entries field contains the deleted entries
				writes.push({
					updateMany: {
						filter: { queues: { $in: deletedEntries } },
						update: { $pull: { queues: { $in: deletedEntries } } },
					},
				});
			}
			await User.bulkWrite(writes, { session });
		});
		response.status(StatusCodes.OK);
		return {
			message: `Successfully deleted queue room with id '${queueRoomId}'.`,
		};
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
};

export default {
	path: '/queue-room',
	middleware: [authenticateUser],
	endpoints: [
		{
			path: '/create',
			method: 'post',
			handler: handleCreate,
		},
		{
			path: '/delete',
			method: 'delete',
			handler: handleDelete,
		},
	],
} as IRouter;

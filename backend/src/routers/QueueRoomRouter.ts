import { StatusCodes } from 'http-status-codes';
import mongoose, { type UpdateQuery } from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import { authenticateUser } from '~/middleware/auth';
import { verifyQueueRoom } from '~/middleware/queue-room';
import QueueEntry from '~/schemas/queues/QueueEntry';
import QueueRoom, { type IQueueRoom } from '~/schemas/queues/QueueRoom';
import User from '~/schemas/User';
import Constants from '~/shared/constants';
import type { IRouter, RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';
import { generateQueueRoomCode, isPlainObject } from '~/utils/helpers';
import { editableQueueRoomSettingsPaths } from '../schemas/queues/QueueRoomSettings';

const handleCreate: RouterRequestHandler = async (request, response) => {
	const { id: userId }: AuthUserInfo = response.locals.user;
	try {
		const newQueueRoom = await mongoose.connection.transaction(async function (session) {
			const { _id: _, ...queueRoomInfo } = request.body;
			const newQueueRoom = new QueueRoom(queueRoomInfo);
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
		console.error(error);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
};

const handleDelete: RouterRequestHandler = async (request, response) => {
	const { id: queueRoomId } = request.body;
	try {
		await mongoose.connection.transaction(async function (session) {
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

			// TODO: Somehow notify all associated users about this deletion
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
		message: `Successfully deleted queue room with id '${queueRoomId}'.`,
	};
};

const handleEdit: RouterRequestHandler = async (request, response) => {
	const { id: queueRoomId, ...queueRoomInfo } = request.body;
	// prettier-ignore
	const editablePaths: (keyof IQueueRoom)[] = [
		'emoji', 'name', 'host', 'description', 'email',
		'status', 'capacity', /* Excluding paths: code, _id, id */
	];
	const setItems: Record<string, any> = {};
	const unsetItems: Record<string, 0> = {};
	for (const path of editablePaths) {
		const newValue = queueRoomInfo[path];
		if (newValue === undefined) continue;
		if (newValue === null) {
			unsetItems[path] = 0;
		} else {
			setItems[path] = newValue;
		}
	}
	// Handle settings subdocument updates separately using dot notation
	const newSettings = queueRoomInfo.settings;
	if (!isPlainObject(newSettings)) {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Invalid settings type.');
	}
	for (const path of editableQueueRoomSettingsPaths) {
		const newValue = newSettings[path];
		if (newValue === undefined) continue;
		const dottedPath = `settings.${path}`;
		if (newValue === null) {
			unsetItems[dottedPath] = 0;
		} else {
			setItems[dottedPath] = newValue;
		}
	}
	const updateQuery = {
		...(Object.keys(setItems).length > 0 ? { $set: setItems } : {}),
		...(Object.keys(unsetItems).length > 0 ? { $unset: unsetItems } : {}),
	} satisfies UpdateQuery<IQueueRoom>;

	if (Object.keys(updateQuery).length > 0) {
		try {
			await mongoose.connection.transaction(async function (session) {
				await QueueRoom.findByIdAndUpdate(queueRoomId, updateQuery, {
					session,
					runValidators: true,
					returnDocument: 'after',
				}).exec();
				// TODO: Return diff between query and updated documents
				// TODO: Apply other path-specific changes
			});
		} catch (error) {
			if (error instanceof BaseError) {
				throw error;
			} else if (error instanceof mongoose.Error.ValidationError) {
				response.status(StatusCodes.UNPROCESSABLE_ENTITY);
				const message = Object.values(error.errors)[0]?.message;
				throw new InvalidRequestError(message);
			} else if (error instanceof mongoose.Error) {
				response.status(StatusCodes.UNPROCESSABLE_ENTITY);
				throw new InvalidRequestError(error.message);
			}
			console.error(error);
			response.status(StatusCodes.INTERNAL_SERVER_ERROR);
			throw new InternalServerError();
		}
	}
	response.status(StatusCodes.OK);
	return {
		message: `Successfully updated queue room with id '${queueRoomId}'.`,
		updated: setItems,
		removed: Object.keys(unsetItems),
	};
};

export default {
	path: '/queue-room',
	middleware: [],
	endpoints: [
		{
			path: '/create',
			method: 'post',
			middlware: [authenticateUser],
			handler: handleCreate,
		},
		{
			path: '/delete',
			method: 'delete',
			middlware: [authenticateUser, verifyQueueRoom],
			handler: handleDelete,
		},
		{
			path: '/edit',
			method: 'put',
			middlware: [authenticateUser, verifyQueueRoom],
			handler: handleEdit,
		},
	],
} as IRouter;

import { StatusCodes } from 'http-status-codes';
import mongoose, { type UpdateQuery } from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import QueueRoom, { type IQueueRoomSchema } from '~/schemas/queues/QueueRoom';
import { editableQueueRoomSettingsPaths } from '~/schemas/queues/QueueRoomSettings';
import type { RouterRequestHandler } from '~/types/api';
import { isPlainObject } from '~/utils/validation';

const handleEdit: RouterRequestHandler = async (request, response) => {
	const { id: queueRoomId, ...queueRoomInfo } = request.body;
	// prettier-ignore
	const editablePaths: (keyof IQueueRoomSchema)[] = [
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
	} satisfies UpdateQuery<IQueueRoomSchema>;

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

export default handleEdit;

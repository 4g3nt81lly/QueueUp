import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import BaseError from '~/errors/base';
import { InvalidRequestError, ResourceNotAvailableError } from '~/errors/rest';
import { InternalServerError, NotFoundError } from '~/errors/server';
import { authenticateUser } from '~/middleware/auth';
import QueueEntry, { type IQueueEntrySchema } from '~/schemas/queues/QueueEntry';
import QueueRoom, { QueueRoomStatus } from '~/schemas/queues/QueueRoom';
import Patterns from '~/shared/patterns';
import type { RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';

// FIXME: All join requests must be handled serially, test properly
const handleJoin: RouterRequestHandler = async (request, response) => {
	let { code, name, email, topic, description } = request.body;
	// Manually validate join code format, no need to query DB if invalid
	if (typeof code !== 'string' || !Patterns.QROOM_CODE.test(code)) {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Invalid join code.');
	}
	let newQueueEntry;
	try {
		newQueueEntry = await mongoose.connection.transaction(async function (session) {
			// Find the queue room with the given code
			const queueRoom = await QueueRoom.findOne({ code })
				.populate<{ entries: IQueueEntrySchema[] }>('entries', 'guestUser guestEmail')
				.session(session)
				.exec();
			if (queueRoom === null) {
				response.status(StatusCodes.NOT_FOUND);
				throw new NotFoundError(`No queue room exists with code "${code}".`);
			}
			if (!queueRoom.isOpen()) {
				response.status(StatusCodes.FORBIDDEN);
				throw new ResourceNotAvailableError(
					'The requested queue is not open and cannot be joined.'
				);
			}
			if (!queueRoom.hasCapacity()) {
				response.status(StatusCodes.FORBIDDEN);
				throw new ResourceNotAvailableError('The requested queue is out of capacity.');
			}
			// Prepare required fields first, leaving optional fields unset
			const newEntry = new QueueEntry({
				roomId: queueRoom._id,
				guestName: name,
				topic,
				description,
			});
			// Authenticate user only if authorization header is provided (logged in)
			let userId = undefined;
			if (request.headers.authorization === undefined) {
				if (email === undefined) {
					response.status(StatusCodes.BAD_REQUEST);
					throw new InvalidRequestError(
						'An email is required to join the queue while logged out.'
					);
				}
				newEntry.guestEmail = email;
			} else {
				await authenticateUser(request, response, () => {});
				userId = (<AuthUserInfo>response.locals.user).id;
				newEntry.guestUser = new mongoose.Types.ObjectId(userId);
			}
			if (queueRoom.hasAlreadyJoined(email, userId)) {
				response.status(StatusCodes.FORBIDDEN);
				throw new ResourceNotAvailableError('You have already joined this queue.');
			}

			// Inserts new queue entry to obtain an ID
			await newEntry.save({ session });

			const updatedQueueRoom = await QueueRoom.findOneAndUpdate(
				{
					_id: queueRoom._id,
					code,
					status: QueueRoomStatus.OPEN,
					$or: [
						{ capacity: -1 },
						{ $expr: { $lt: [{ $size: '$entries' }, '$capacity'] } },
					],
				},
				{
					$push: { entries: newEntry._id },
				},
				{ session, runValidators: true, returnDocument: 'after' }
			).exec();

			if (updatedQueueRoom === null) {
				try {
					await newEntry.deleteOne({ session });
				} finally {
					response.status(StatusCodes.FORBIDDEN);
					throw new ResourceNotAvailableError(
						'Unable to join the queue, please try again!'
					);
				}
			}
			return newEntry;
		});
	} catch (error) {
		if (error instanceof BaseError) {
			throw error;
		} else if (error instanceof mongoose.Error.ValidationError) {
			response.status(StatusCodes.BAD_REQUEST);
			const message = Object.values(error.errors)[0]?.message;
			throw new InvalidRequestError(message);
		}
		console.error(error);
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError(
			'An unexpected error occurred while joining a queue room.'
		);
	}
	response.status(StatusCodes.CREATED);
	return {
		message: `Successfully joined the queue room with code "${code}".`,
		data: newQueueEntry.toData(),
	};
};

export default handleJoin;

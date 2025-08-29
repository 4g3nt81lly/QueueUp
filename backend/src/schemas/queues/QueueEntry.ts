import { Schema, model, type Types } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';
import type Timestamped from '../Timestamped';

export interface IQueueEntry extends Timestamped {
	readonly _id: Types.ObjectId;
	readonly roomId: Types.ObjectId;
	guestUser?: Types.ObjectId;
	guestName: string;
	guestEmail?: string;
	topic: string;
	description: string;
}

export const queueEntrySchema = new Schema<IQueueEntry>(
	{
		roomId: {
			type: Schema.Types.ObjectId,
			ref: 'QueueRoom',
			required: [true, 'Missing room ID.'],
		},
		guestUser: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		guestName: {
			type: String,
			required: [true, 'A name is required to join a queue.'],
			minLength: [1, 'Guest name must not be empty.'],
			maxLength: [
				Constants.USER_NAME_MAX_LENGTH,
				`Guest name must not be longer than ${Constants.USER_NAME_MAX_LENGTH} characters.`,
			],
		},
		guestEmail: {
			type: String,
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`Email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, `'{VALUE}' is not a valid email address.`],
		},
		topic: {
			type: String,
			required: [true, 'A topic is required to join a queue.'],
			minLength: [1, 'Topic must not be empty.'],
			maxLength: [
				Constants.QENTRY_TOPIC_MAX_LENGTH,
				`Topic must not be longer than ${Constants.QENTRY_TOPIC_MAX_LENGTH} characters.`,
			],
		},
		description: {
			type: String,
			required: true,
			default: '',
		},
	},
	{ timestamps: true, optimisticConcurrency: true }
);

export default model<IQueueEntry>('QueueEntry', queueEntrySchema, 'queue-entries');

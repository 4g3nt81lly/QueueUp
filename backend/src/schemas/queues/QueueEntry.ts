import { Schema, model, type Types } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';

export interface IQueueEntry {
	readonly _id: Types.ObjectId;
	readonly roomId: Types.ObjectId;
	topic: string;
	description: string;
	guestName: string;
	guestUser?: Types.ObjectId;
	guestEmail?: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export const queueEntrySchema = new Schema<IQueueEntry>(
	{
		roomId: {
			type: Schema.Types.ObjectId,
			ref: 'QueueRoom',
			required: true,
		},
		topic: {
			type: String,
			required: true,
			minLength: 1,
			maxLength: Constants.QENTRY_TOPIC_MAX_LENGTH,
		},
		description: {
			type: String,
			required: true,
			default: '',
		},
		guestName: {
			type: String,
			required: true,
			minLength: 1,
			maxLength: Constants.USER_NAME_MAX_LENGTH,
		},
		guestUser: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		guestEmail: {
			type: String,
			maxLength: Constants.USER_EMAIL_MAX_LENGTH,
			match: Patterns.USER_EMAIL,
		},
	},
	{ timestamps: true, optimisticConcurrency: true }
);

export default model<IQueueEntry>('QueueEntry', queueEntrySchema, 'queue-entries');

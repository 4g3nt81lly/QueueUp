import jwt from 'jsonwebtoken';
import { Schema, Types, model, type Model } from 'mongoose';
import Constants from '~/shared/constants';
import { ACCESS_TOKEN_SECRET } from '~/shared/environment';
import Patterns from '~/shared/patterns';
import type { AuthUserInfo } from '~/types/auth';
import type { ISendableSchema, ITimestampedSchema } from '../SchemaTypes';

export interface IQueueEntry {
	readonly id: string;
	readonly roomId: string;
	readonly guestUser?: string;
	readonly guestName: string;
	readonly guestEmail?: string;
	readonly topic: string;
	readonly description: string;
}

export interface IQueueEntrySchema extends ITimestampedSchema {
	readonly _id: Types.ObjectId;
	roomId: Types.ObjectId;
	guestUser?: Types.ObjectId;
	guestName: string;
	guestEmail?: string;
	topic: string;
	description: string;
}

export interface IQueueEntryMethods extends ISendableSchema<IQueueEntry> {}

type QueueEntryModelType = Model<IQueueEntrySchema, {}, IQueueEntryMethods>;

export const QueueEntrySchema = new Schema<
	IQueueEntrySchema,
	QueueEntryModelType,
	IQueueEntryMethods
>(
	{
		roomId: {
			type: Schema.Types.ObjectId,
			cast: 'Invalid type: queue room ID',
			ref: 'QueueRoom',
			required: [true, 'Missing room ID.'],
		},
		guestUser: {
			type: Schema.Types.ObjectId,
			cast: 'Invalid type: queue room guest user ID',
			ref: 'User',
		},
		guestName: {
			type: String,
			cast: 'Invalid type: queue room guest name',
			required: [true, 'A name is required to join the queue.'],
			minLength: [1, 'Guest name must not be empty.'],
			maxLength: [
				Constants.USER_NAME_MAX_LENGTH,
				`Guest name must not be longer than ${Constants.USER_NAME_MAX_LENGTH} characters.`,
			],
		},
		guestEmail: {
			type: String,
			cast: 'Invalid type: queue room guest email address',
			required: [
				function () {
					return !Types.ObjectId.isValid(this.guestUser ?? '');
				},
				'An email is required to join the queue while logged out.',
			],
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`Email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, '"{VALUE}" is not a valid email address.'],
		},
		topic: {
			type: String,
			cast: 'Invalid type: queue room topic',
			required: [true, 'A topic is required to join a queue.'],
			minLength: [1, 'Topic must not be empty.'],
			maxLength: [
				Constants.QENTRY_TOPIC_MAX_LENGTH,
				`Topic must not be longer than ${Constants.QENTRY_TOPIC_MAX_LENGTH} characters.`,
			],
		},
		description: {
			type: String,
			cast: 'Invalid type: queue room description',
			required: true,
			default: '',
		},
	},
	{
		methods: {
			toData() {
				const data: Record<string, any> = this.toObject({
					schemaFieldsOnly: true,
					versionKey: false,
				});
				// Generate and attach temporary access token if user credential is missing
				// This token will be used to identify clients that are not logged in
				if (this.guestUser === undefined) {
					const jwtPayload = <AuthUserInfo>{
						id: this._id.toHexString(),
						username: this.guestEmail!,
					};
					data.token = jwt.sign(jwtPayload, ACCESS_TOKEN_SECRET);
				}
				// ObjectId should be hidden away from the client
				delete data._id;
				return data as IQueueEntry;
			},
		},
		timestamps: true,
		optimisticConcurrency: true,
	}
);

export default model<IQueueEntrySchema, QueueEntryModelType>(
	'QueueEntry',
	QueueEntrySchema,
	'queue-entries'
);

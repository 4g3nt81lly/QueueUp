import { Schema, model, type Model, type Types, type ValidatorProps } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';
import { validateQueueRoomCapacity, validateQueueRoomEmoji } from '~/utils/validation';
import type { ISendableSchema, ITimestampedSchema } from '../SchemaTypes';
import type { IQueueEntrySchema } from './QueueEntry';
import QueueRoomSettingsSchema, { type IQueueRoomSettings } from './QueueRoomSettings';

export enum QueueRoomStatus {
	CLOSED = 0,
	PAUSED = 1,
	OPEN = 2,
}

export interface IQueueRoom {
	readonly id: string;
	readonly user: string;
	code: string;
	emoji?: string;
	name: string;
	host: string;
	email?: string;
	description: string;
	status: QueueRoomStatus;
	capacity: number;
	entries: string[];
	skippedEntries: string[];
	createdAt: string;
	updatedAt: string;
}

export interface IQueueRoomSchema extends ITimestampedSchema {
	readonly _id: Types.ObjectId;
	readonly user: Types.ObjectId;
	code: string;
	emoji?: string;
	name: string;
	host: string;
	email?: string;
	description: string;
	status: QueueRoomStatus;
	capacity: number;
	entries: Types.ObjectId[];
	skippedEntries: Types.ObjectId[];
	settings: IQueueRoomSettings;
}

export interface IQueueRoomSchemaMethods extends ISendableSchema<IQueueRoom> {
	isOpen(): boolean;
	hasCapacity(): boolean;
	hasAlreadyJoined(email: string, userId?: string): boolean;
}

type QueueRoomModelType = Model<IQueueRoomSchema, {}, IQueueRoomSchemaMethods>;

export const QueueRoomSchema = new Schema<
	IQueueRoomSchema,
	QueueRoomModelType,
	IQueueRoomSchemaMethods
>(
	{
		user: {
			type: Schema.Types.ObjectId,
			cast: 'Invalid type: owner user ID',
			ref: 'User',
			required: [true, 'Queue room must have an owner.'],
		},
		code: {
			type: String,
			cast: 'Invalid type: queue room join code',
			required: [true, 'Queue room must have a join code.'],
			unique: [true, 'Queue room join code "{VALUE}" already exists.'],
			trim: true,
			match: [Patterns.QROOM_CODE, '"{VALUE}" is not a valid queue room join code.'],
		},
		emoji: {
			type: String,
			cast: 'Invalid type: emoji',
			validate: {
				validator(value: any) {
					return validateQueueRoomEmoji.call(this, value);
				},
				message({ value }: ValidatorProps) {
					return `Invalid emoji "${value}".`;
				},
			},
		},
		name: {
			type: String,
			cast: 'Invalid type: queue room name',
			required: [true, 'Queue room must have a name.'],
			trim: true,
			minLength: [1, 'Queue room name must not be empty.'],
			maxLength: [
				Constants.QROOM_NAME_MAX_LENGTH,
				`Queue room name must not be longer than ${Constants.QROOM_NAME_MAX_LENGTH} characters.`,
			],
		},
		host: {
			type: String,
			cast: 'Invalid type: queue room host name',
			required: [true, 'Queue room must have a host name.'],
			trim: true,
			minLength: [1, 'Queue room host name must not be empty.'],
			maxLength: [
				Constants.USER_NAME_MAX_LENGTH,
				`Queue room host name must not be longer than ${Constants.USER_NAME_MAX_LENGTH} characters.`,
			],
		},
		email: {
			type: String,
			cast: 'Invalid type: email address',
			trim: true,
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`Queue room host email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, '"{VALUE}" is not a valid email address.'],
		},
		description: {
			type: String,
			cast: 'Invalid type: queue room description',
			required: true,
			default: '',
			maxLength: [
				Constants.QROOM_DESCRIPTION_MAX_LENGTH,
				`Queue room description must not be longer than ${Constants.QROOM_DESCRIPTION_MAX_LENGTH} characters.`,
			],
		},
		status: {
			type: Number,
			cast: 'Invalid type: queue room status',
			enum: Object.values(QueueRoomStatus).filter(Number.isInteger),
			required: true,
			default: QueueRoomStatus.OPEN,
		},
		capacity: {
			type: Number,
			cast: 'Invalid type: queue room capacity',
			required: true,
			default: -1,
			validate: {
				validator(value: any) {
					return validateQueueRoomCapacity.call(this, value);
				},
				message({ value }: ValidatorProps) {
					return `Queue room capacity must be -1 (no limit) or a strictly positive number less than ${Constants.QROOM_MAX_CAPACITY}, got "${value}" instead.`;
				},
			},
		},
		entries: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'QueueEntry',
				},
			],
			required: true,
			default: () => [],
		},
		skippedEntries: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'QueueEntry',
				},
			],
			required: true,
			default: () => [],
		},
		settings: {
			type: QueueRoomSettingsSchema,
			required: true,
			default: () => <IQueueRoomSettings>{},
		},
	},
	{
		methods: {
			toData() {
				const data: Record<string, any> = {
					id: this._id.toHexString(),
					...this.toObject({
						schemaFieldsOnly: true,
						versionKey: false,
					}),
				};
				delete data._id;
				return data as IQueueRoom;
			},
			isOpen() {
				return this.status === QueueRoomStatus.OPEN;
			},
			hasCapacity() {
				return this.capacity === -1 || this.entries.length < this.capacity;
			},
			hasAlreadyJoined(email, userId) {
				return this.$assertPopulated<{
					entries: IQueueEntrySchema[];
				}>('entries').entries.some((entry) => {
					return userId
						? entry.guestUser?.toHexString() === userId
						: entry.guestEmail === email;
				});
			},
		},
		timestamps: true,
		optimisticConcurrency: true,
	}
);

export default model<IQueueRoomSchema, QueueRoomModelType>(
	'QueueRoom',
	QueueRoomSchema,
	'queue-rooms'
);

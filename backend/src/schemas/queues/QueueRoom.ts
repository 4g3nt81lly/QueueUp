import { Schema, model, type ValidatorProps } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';
import queryRoomSettingsSchema from './QueueRoomSettings';

export enum QueueRoomStatus {
	CLOSED = 0,
	PAUSED = 1,
	FULL = 2,
	OPEN = 3,
}

export const queueRoomSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Queue room must have an owner.'],
			immutable: [true, 'Queue room owner cannot be changed.'],
			alias: 'owner',
		},
		emoji: {
			type: String,
			validate: {
				validator(value: any) {
					if (typeof value !== 'string') {
						return false;
					}
					const matches = [...value.matchAll(Patterns.QROOM_EMOJI)];
					if (matches.length !== 1) {
						return false;
					}
					const emoji = matches[0][0];
					return [...emoji].length === [...value].length;
				},
				message({ value }: ValidatorProps) {
					return `Invalid emoji value '${value}'.`;
				},
			},
		},
		name: {
			type: String,
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
			trim: true,
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`Queue room host email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, `'{VALUE}' is not a valid email.`],
		},
		description: {
			type: String,
			required: true,
			default: '',
			maxLength: [
				Constants.QROOM_DESCRIPTION_MAX_LENGTH,
				`Queue room description must not be longer than ${Constants.QROOM_DESCRIPTION_MAX_LENGTH} characters.`,
			],
		},
		status: {
			type: Number,
			enum: Object.values(QueueRoomStatus).filter(Number.isInteger),
			required: true,
			default: QueueRoomStatus.OPEN,
		},
		capacity: {
			type: Number,
			required: true,
			default: -1,
			validate: {
				validator(value: any) {
					if (!Number.isInteger(value)) {
						return false;
					}
					return value === -1 || (value > 0 && value <= Constants.QROOM_MAX_CAPACITY);
				},
				message({ value }: ValidatorProps) {
					return `Queue room capacity must be -1 (no limit) or a strictly positive number less than ${Constants.QROOM_MAX_CAPACITY}, got ${value} instead.`;
				},
			},
		},
		code: {
			type: String,
			required: [true, 'Queue room must have a join code.'],
			unique: [true, 'Queue room join code {VALUE} already exists.'],
			trim: true,
			match: [Patterns.QROOM_CODE, `'{VALUE}' is not a valid queue room join code.`],
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
			type: queryRoomSettingsSchema,
			required: true,
			default: () => {},
		},
	},
	{
		timestamps: true,
		optimisticConcurrency: true,
	}
);

export default model('QueueRoom', queueRoomSchema, 'queue-rooms');

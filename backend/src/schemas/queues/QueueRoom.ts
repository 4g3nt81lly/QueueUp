import { Schema, model } from 'mongoose';
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
			required: true,
			immutable: true,
			alias: 'user',
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
			},
		},
		name: {
			type: String,
			required: true,
			trim: true,
			minLength: 1,
			maxLength: Constants.QROOM_NAME_MAX_LENGTH,
		},
		host: {
			type: String,
			required: true,
			trim: true,
			minLength: 1,
			maxLength: Constants.USER_NAME_MAX_LENGTH,
		},
		email: {
			type: String,
			trim: true,
			maxLength: Constants.USER_EMAIL_MAX_LENGTH,
			match: Patterns.USER_EMAIL,
		},
		description: {
			type: String,
			required: true,
			default: '',
			maxLength: Constants.QROOM_DESCRIPTION_MAX_LENGTH,
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
					return value === -1
						|| (value > 0 && value <= Constants.QROOM_MAX_CAPACITY);
				},
			},
		},
		code: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			match: Patterns.QROOM_CODE,
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
	{ timestamps: true, optimisticConcurrency: true }
);

export default model('QueueRoom', queueRoomSchema, 'queue-rooms');

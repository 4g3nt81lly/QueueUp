import { Schema, model } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';

export const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minLength: 1,
			maxLength: Constants.USER_NAME_MAX_LENGTH,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			maxLength: Constants.USER_EMAIL_MAX_LENGTH,
			match: Patterns.USER_EMAIL,
		},
		password: {
			type: String,
			required: true,
			select: false,
		},
		queues: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'QueueRoom',
				},
			],
			required: true,
			default: () => [],
		},
	},
	{ optimisticConcurrency: true }
);

export default model('User', userSchema, 'users');

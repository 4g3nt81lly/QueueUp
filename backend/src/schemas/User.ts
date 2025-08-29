import { Schema, model, type Types } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';

export interface IUser {
	readonly _id: Types.ObjectId;
	name: string;
	email: string;
	password: string;
}

export const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: [true, 'A user must have a name.'],
			trim: true,
			minLength: [1, 'Username must not be empty.'],
			maxLength: [
				Constants.USER_NAME_MAX_LENGTH,
				`Username must not be longer than ${Constants.USER_NAME_MAX_LENGTH} characters.`,
			],
		},
		email: {
			type: String,
			required: [true, 'An email is required.'],
			unique: [true, 'An account with this email already exists.'],
			trim: true,
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`User email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, `'{VALUE}' is not a valid email address.`],
		},
		password: {
			type: String,
			required: [true, 'Password is required.'],
			select: false,
		},
	},
	{ optimisticConcurrency: true }
);

export default model<IUser>('User', userSchema, 'users');

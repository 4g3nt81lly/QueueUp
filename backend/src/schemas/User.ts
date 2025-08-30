import { Schema, model, type Model, type Types } from 'mongoose';
import Constants from '~/shared/constants';
import Patterns from '~/shared/patterns';
import type { ISendableSchema } from './SchemaTypes';

export interface IUser {
	readonly id: string;
	readonly name: string;
	readonly email: string;
}

export interface IUserSchema {
	readonly _id: Types.ObjectId;
	name: string;
	email: string;
	password: string;
}

interface IUserSchemaMethods extends ISendableSchema<IUser> {}

type UserModelType = Model<IUserSchema, {}, IUserSchemaMethods>;

export const UserSchema = new Schema<IUserSchema, UserModelType, IUserSchemaMethods>(
	{
		name: {
			type: String,
			cast: 'Invalid type: username',
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
			cast: 'Invalid type: email address',
			required: [true, 'An email is required.'],
			unique: [true, 'An account with this email already exists.'],
			trim: true,
			maxLength: [
				Constants.USER_EMAIL_MAX_LENGTH,
				`User email must not be longer than ${Constants.USER_EMAIL_MAX_LENGTH} characters.`,
			],
			match: [Patterns.USER_EMAIL, '"{VALUE}" is not a valid email address.'],
		},
		password: {
			type: String,
			required: [true, 'Password is required.'],
			select: false,
		},
	},
	{
		methods: {
			toData(): IUser {
				return {
					id: this._id.toHexString(),
					name: this.name,
					email: this.email,
				};
			},
		},
		optimisticConcurrency: true,
	}
);

export default model<IUserSchema, UserModelType>('User', UserSchema, 'users');

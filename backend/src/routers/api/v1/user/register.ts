import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { CredentialValidationError } from '~/errors/auth';
import { InvalidRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import User, { type IUser } from '~/schemas/User';
import Constants from '~/shared/constants';
import { ACCESS_TOKEN_SECRET } from '~/shared/environment';
import type { RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';

const handleRegister: RouterRequestHandler = async (request, response) => {
	const { username, email, password } = request.body;
	if (
		typeof username !== 'string' ||
		typeof email !== 'string' ||
		typeof password !== 'string'
	) {
		response.status(StatusCodes.BAD_REQUEST);
		throw new InvalidRequestError('Invalid username, email, or password type.');
	}
	if (password.length < Constants.USER_PASSWORD_MIN_LENGTH) {
		response.status(StatusCodes.UNPROCESSABLE_ENTITY);
		throw new CredentialValidationError('Password must be at least 8 characters long.');
	}
	let newUser: IUser;
	try {
		newUser = (
			await User.create({
				name: username,
				email,
				password: bcrypt.hashSync(password, 10),
			})
		).toData();
	} catch (error: any) {
		if (error instanceof mongoose.Error.ValidationError) {
			response.status(StatusCodes.BAD_REQUEST);
			throw new CredentialValidationError(error.message);
		} else if (error.code === Constants.MONGO_DUPLICATE_KEY_ERROR) {
			// Duplicate key error with email
			response.status(StatusCodes.UNPROCESSABLE_ENTITY);
			throw new CredentialValidationError('A user with this email already exists.');
		}
		response.status(StatusCodes.INTERNAL_SERVER_ERROR);
		throw new InternalServerError();
	}
	const jwtPayload = <AuthUserInfo>{
		id: newUser.id,
		username: newUser.name,
	};
	response.status(StatusCodes.CREATED);
	return {
		message: 'Registration successful.',
		token: jwt.sign(jwtPayload, ACCESS_TOKEN_SECRET),
		...newUser,
	};
};

export default handleRegister;

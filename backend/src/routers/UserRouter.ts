import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import mongoose, { type HydratedDocument } from 'mongoose';
import { CredentialValidationError } from '~/errors/auth';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import User, { type IUser, type IUserSchema } from '~/schemas/User';
import Constants from '~/shared/constants';
import { ACCESS_TOKEN_SECRET } from '~/shared/environment';
import type { IRouter } from '~/types/api';
import { AuthUserInfo } from '~/types/auth';

export default {
	path: '/users',
	endpoints: [
		{
			path: '/login',
			method: 'post',
			async handler(request, response) {
				const { email, password } = request.body;
				if (typeof email !== 'string' || typeof password !== 'string') {
					response.status(StatusCodes.BAD_REQUEST);
					throw new InvalidRequestError('Invalid email or password type.');
				}
				const user = await User.findOne({ email }).select('name email password').exec();
				if (user !== null) {
					const passwordMatch = await bcrypt.compare(password, user.password);
					if (passwordMatch) {
						const jwtPayload = <AuthUserInfo>{
							id: user.id,
							username: user.name,
						};
						response.status(StatusCodes.OK);
						return {
							message: 'Login successful.',
							token: jwt.sign(jwtPayload, ACCESS_TOKEN_SECRET),
							...user.toData(),
						};
					}
				}
				response.status(StatusCodes.UNAUTHORIZED);
				throw new UnauthorizedRequestError('Incorrect email or password.');
			},
		},
		{
			path: '/register',
			method: 'post',
			async handler(request, response) {
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
					throw new CredentialValidationError(
						'Password must be at least 8 characters long.'
					);
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
			},
		},
	],
} as IRouter;

import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { CredentialValidationError } from '~/errors/auth';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import { InternalServerError } from '~/errors/server';
import User from '~/schemas/User';
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
				const userDocument = await User.findOne({ email })
					.select('name email password')
					.exec();
				if (userDocument) {
					const correctPassword = userDocument.password;
					const passwordMatch = await bcrypt.compare(password, correctPassword);
					if (passwordMatch) {
						const jwtPayload = <AuthUserInfo>{
							id: userDocument.id,
							username: userDocument.name,
						};
						response.status(StatusCodes.OK);
						return {
							id: userDocument.id,
							name: userDocument.name,
							token: jwt.sign(jwtPayload, ACCESS_TOKEN_SECRET),
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
				try {
					const newUserDocument = (
						await User.create({
							name: username,
							email,
							password: bcrypt.hashSync(password, 10),
						})
					).toJSON();
					const jwtPayload = <AuthUserInfo>{
						id: newUserDocument._id.toHexString(),
						username: newUserDocument.name,
					};
					response.status(StatusCodes.CREATED);
					return {
						id: jwtPayload.id,
						name: jwtPayload.username,
						token: jwt.sign(jwtPayload, ACCESS_TOKEN_SECRET),
					};
				} catch (error: any) {
					if (error instanceof mongoose.Error.ValidationError) {
						response.status(StatusCodes.UNPROCESSABLE_ENTITY);
						throw new CredentialValidationError(error.message);
					} else if (error.code === Constants.MONGO_DUPLICATE_KEY_ERROR) {
						// Duplicate key error with email
						response.status(StatusCodes.UNPROCESSABLE_ENTITY);
						throw new CredentialValidationError('A user with this email already exists.');
					} else {
						response.status(StatusCodes.INTERNAL_SERVER_ERROR);
						throw new InternalServerError();
					}
				}
			},
		},
	],
} as IRouter;

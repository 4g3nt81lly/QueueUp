import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { InvalidRequestError, UnauthorizedRequestError } from '~/errors/rest';
import User from '~/schemas/User';
import { ACCESS_TOKEN_SECRET } from '~/shared/environment';
import type { RouterRequestHandler } from '~/types/api';
import type { AuthUserInfo } from '~/types/auth';

const handleLogin: RouterRequestHandler = async (request, response) => {
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
};

export default handleLogin;

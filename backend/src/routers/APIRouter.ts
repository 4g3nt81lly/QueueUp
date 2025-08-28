import { StatusCodes } from 'http-status-codes';
import type { IRouter } from '../types/api';
import QueueRoomRouter from './QueueRoomRouter';
import UserRouter from './UserRouter';

export default {
	path: '/api/v1',
	endpoints: [
		{
			path: '/echo',
			method: 'get',
			middlware: [
				(request, response, next) => {
					console.log('🔊 An echo request was received!');
					next();
				},
			],
			handler(request, response) {
				response.status(StatusCodes.OK);
				return 'OK';
			},
		},
	],
	subrouters: [UserRouter, QueueRoomRouter],
} as IRouter;

import type { IRouter } from '~/types/api';
import handleLogin from './login';
import handleRegister from './register';

export default {
	path: '/users',
	endpoints: [
		{
			path: '/login',
			method: 'post',
			handler: handleLogin,
		},
		{
			path: '/register',
			method: 'post',
			handler: handleRegister,
		},
	],
} as IRouter;

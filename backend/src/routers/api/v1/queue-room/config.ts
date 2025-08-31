import { authenticateRequest } from '~/middleware/auth';
import { validateQueueRoom } from '~/middleware/queue-room';
import type { IRouter } from '~/types/api';
import handleCreate from './create';
import handleDelete from './delete';
import handleEdit from './edit';
import handleJoin from './join';
import handleLeave from './leave';

export default {
	path: '/queue-room',
	middleware: [],
	endpoints: [
		{
			path: '/create',
			method: 'post',
			middlware: [authenticateRequest],
			handler: handleCreate,
		},
		{
			path: '/delete',
			method: 'delete',
			middlware: [authenticateRequest, validateQueueRoom],
			handler: handleDelete,
		},
		{
			path: '/edit',
			method: 'put',
			middlware: [authenticateRequest, validateQueueRoom],
			handler: handleEdit,
		},
		{
			path: '/join',
			method: 'post',
			handler: handleJoin,
		},
		{
			path: '/leave',
			method: 'delete',
			handler: handleLeave,
		},
	],
} as IRouter;

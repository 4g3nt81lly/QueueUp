import { authenticateUser } from '~/middleware/auth';
import { verifyQueueRoom } from '~/middleware/queue-room';
import type { IRouter } from '~/types/api';
import handleCreate from './create';
import handleDelete from './delete';
import handleEdit from './edit';
import handleJoin from './join';

export default {
	path: '/queue-room',
	middleware: [],
	endpoints: [
		{
			path: '/create',
			method: 'post',
			middlware: [authenticateUser],
			handler: handleCreate,
		},
		{
			path: '/delete',
			method: 'delete',
			middlware: [authenticateUser, verifyQueueRoom],
			handler: handleDelete,
		},
		{
			path: '/edit',
			method: 'put',
			middlware: [authenticateUser, verifyQueueRoom],
			handler: handleEdit,
		},
		{
			path: '/join',
			method: 'post',
			handler: handleJoin,
		},
	],
} as IRouter;

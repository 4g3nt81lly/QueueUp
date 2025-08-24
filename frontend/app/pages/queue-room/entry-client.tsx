import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import QueueRoomPage from './QueueRoomPage';

hydrateRoot(
	document.getElementById('root')!,
	<StrictMode>
		<QueueRoomPage />
	</StrictMode>
);

import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import HomePage from '../app/pages/home/HomePage';
import LoginPage from '../app/pages/login/LoginPage';
import QueueRoomPage from '../app/pages/queue-room/QueueRoomPage';
import type { ServerRenderResult } from './types';

export type PageRenderFunctions = {
	renderHomePage: typeof renderHomePage;
	renderLoginPage: typeof renderLoginPage;
	renderQueueRoomPage: typeof renderQueueRoomPage;
};

export function renderHomePage(): ServerRenderResult {
	return {
		body: renderToString(
			<StrictMode>
				<HomePage />
			</StrictMode>
		),
	};
}

export function renderLoginPage(): ServerRenderResult {
	return {
		body: renderToString(
			<StrictMode>
				<LoginPage />
			</StrictMode>
		),
	};
}

export function renderQueueRoomPage(): ServerRenderResult {
	return {
		body: renderToString(
			<StrictMode>
				<QueueRoomPage />
			</StrictMode>
		),
	};
}

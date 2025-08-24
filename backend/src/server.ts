import cors from 'cors';
import express, { type Request, type Response } from 'express';
import type http from 'http';
import { StatusCodes } from 'http-status-codes';
import { Server as SocketIOServer } from 'socket.io';
import routerConfig from './routers/config';
import { FRONTEND_ORIGIN, PORT } from './shared';
import { IRouter } from './types/api';
import { makeEndpointRequestHandler, sendErrorResponse } from './utils/helpers';

export default class Server {
	private readonly app: express.Application;
	private httpServer?: http.Server;
	private socketServer?: SocketIOServer;

	public constructor(app: express.Application) {
		this.app = app;

		this.registerMiddleware();
		this.registerRoutes();
		this.registerErrorHandlers();
	}

	public async start() {
		console.log('🚪 Frontend origin:', FRONTEND_ORIGIN);

		await new Promise<void>((resolve, reject) => {
			this.httpServer = this.app.listen(PORT, (error?: Error) => {
				if (!error) {
					return resolve();
				}
				reject(new Error(`❌ Server could not be started: ${error.message}`));
			});
		});
		console.log(`🚀 Server started, listening on port ${PORT}...`);

		this.initializeSocketServer();
	}

	public stop() {
		this.socketServer?.disconnectSockets();
		this.httpServer?.closeAllConnections();
	}

	private registerMiddleware() {
		this.app.use(express.json());
		this.app.use(express.raw({ type: 'application/*', limit: '10mb' }));

		this.app.use(
			cors({
				origin: [FRONTEND_ORIGIN],
				credentials: true,
			})
		);

		if (routerConfig.middlware && routerConfig.middlware.length > 0) {
			this.app.use(routerConfig.middlware);
		}
	}

	/* REST API */

	private registerRoutes() {
		Server.registerRouter(this.app, routerConfig.routers);
	}

	private static registerRouter(parentRouter: express.Router, iRouters: IRouter[]) {
		if (iRouters.length === 0) {
			return;
		}
		for (const iRouter of iRouters) {
			const router = express.Router();
			// register middleware before registering endpoint handlers
			if (iRouter.middleware && iRouter.middleware.length > 0) {
				router.use(iRouter.middleware);
			}

			for (const endpoint of iRouter.endpoints ?? []) {
				router[endpoint.method](
					endpoint.path,
					...(endpoint.middlware ?? []),
					makeEndpointRequestHandler(endpoint.handler)
				);
			}
			parentRouter.use(iRouter.path, router);

			// configure and register child routers
			this.registerRouter(router, iRouter.subrouters ?? []);
		}
	}

	private registerErrorHandlers() {
		// TODO: register custom error handlers
		this.app.use((request: Request, response: Response) => {
			let errorName = 'ServerError';
			if (response.statusCode !== StatusCodes.INTERNAL_SERVER_ERROR) {
				response.status(StatusCodes.NOT_FOUND);
				errorName = 'NotFoundError';
			}
			sendErrorResponse({ error: errorName }, response);
		});
	}

	/* Socket.io Server */

	private initializeSocketServer() {
		this.socketServer = new SocketIOServer(this.httpServer!, {
			cors: {
				origin: FRONTEND_ORIGIN,
				credentials: true,
			},
			// maxHttpBufferSize: 100 * 1024 * 1024,
		});
		console.log('🔌 Socket server ready!');

		this.registerSocketConnectionEvent();
	}

	private registerSocketConnectionEvent() {
		this.socketServer!.on('connection', (socket) => {
			console.log(`⚡️ Socket connected: ${socket.id}`);

			// TODO: register event listeners for the socket connection
		});
	}
}

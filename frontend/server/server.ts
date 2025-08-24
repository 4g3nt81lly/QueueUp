import compression from 'compression';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import { resolve } from 'node:path';
import { __server_dirname, isProduction } from './shared.ts';
import type { ServerRenderFunctions } from './entry-server.tsx';

const __dist_dirname = resolve(__server_dirname, '../dist');
const __client_dirname = resolve(__dist_dirname, 'client');
const __pages_dirname = resolve(__client_dirname, 'pages');

export default class Server {
	private readonly app: express.Application;

	private render?: ServerRenderFunctions;
	private templateContents: Map<string, string>;

	public constructor() {
		this.app = express();

		this.templateContents = new Map();

		this.configureMiddlewares();
		this.configureRoutes();

		this.loadEntryServerRenderMethods();
		this.preloadAssets();
	}

	private configureMiddlewares() {
		this.app.use(compression());
		this.app.use('/assets', express.static(resolve(__client_dirname, 'assets')));
	}

	private configureRoutes() {
		this.app.get('/', this.serveHomePage.bind(this));
		this.app.get('/login', this.serveLoginPage.bind(this));
		this.app.get('/queue/:queueId', this.serverQueueRoomPage.bind(this));
	}

	private preloadAssets() {
		this.templateContents.set(
			'/',
			fs.readFileSync(resolve(__pages_dirname, 'home', 'index.html'), 'utf-8')
		);
		this.templateContents.set(
			'/login',
			fs.readFileSync(resolve(__pages_dirname, 'login', 'index.html'), 'utf-8')
		);
		this.templateContents.set(
			'/queue',
			fs.readFileSync(resolve(__pages_dirname, 'queue-room', 'index.html'), 'utf-8')
		);
	}

	private async loadEntryServerRenderMethods() {
		this.render = await import(resolve(__dist_dirname, 'server/entry-server.js'));
	}

	private serveHomePage(request: Request, response: Response) {
		try {
			const templateHTML = this.templateContents.get('/')!;
			const { head = '', body } = this.render!.renderHomePage();

			const renderedHTML = templateHTML.replace('<!--home-head-->', head).replace('<!--home-root-->', body);
			response.status(StatusCodes.OK).type('html').end(renderedHTML);
		} catch (err) {
			const error = err as Error;
			console.error('Failed to render page:', error.stack);
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).end(error.stack);
		}
	}

	private serveLoginPage(request: Request, response: Response) {
		try {
			const templateHTML = this.templateContents.get('/login')!;
			const { body } = this.render!.renderLoginPage();

			const renderedHTML = templateHTML.replace('<!--login-root-->', body);
			response.status(StatusCodes.OK).type('html').end(renderedHTML);
		} catch (err) {
			const error = err as Error;
			console.error('Failed to render page:', error.stack);
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).end(error.stack);
		}
	}

	private serverQueueRoomPage(request: Request<{ queueId: string }>, response: Response) {
		try {
			const { queueId } = request.params;

			const templateHTML = this.templateContents.get('/queue')!;

			const { head = '', body } = this.render!.renderQueueRoomPage();

			const renderedHTML = templateHTML
				.replace('<!--queue-room-id-->', ` ${queueId}`)
				.replace('<!--queue-room-head-->', head)
				.replace('<!--queue-room-root-->', body);
			response.status(StatusCodes.OK).type('html').end(renderedHTML);
		} catch (err) {
			const error = err as Error;
			console.error('Failed to render page:', error.stack);
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).end(error.stack);
		}
	}

	public start() {
		const port = process.env.PORT ?? (isProduction ? 3000 : 5173);
		if (!this.render) {
			return setTimeout(this.start.bind(this));
		}
		this.app.listen(port, (error) => {
			if (error) {
				console.log('❌ Unable to start frontend server:', error);
			} else {
				console.log(`✅ Frontend server started at http://localhost:${port}`);
			}
		});
	}
}

import compression from 'compression';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import { resolve } from 'node:path';
import type { PageRenderFunctions } from './entry-server.tsx';
import { __server_dirname, isProduction } from './shared.ts';
import type { PageRenderConfig } from './types.ts';

const __dist_dirname = resolve(__server_dirname, '../dist');
const __client_dirname = resolve(__dist_dirname, 'client');
const __pages_dirname = resolve(__client_dirname, 'pages');

export default class Server {
	private readonly app: express.Application;

	private render!: PageRenderFunctions;
	private readonly pageRenderConfigs: Map<string, PageRenderConfig>;
	private readonly templateContents: Map<string, string>;

	private _isInitialized: boolean;

	public constructor() {
		this.app = express();

		this.pageRenderConfigs = new Map();
		this.templateContents = new Map();

		this.configureMiddlewares();

		this._isInitialized = false;

		// Asynchronous initializations
		(async () => {
			await this.loadEntryServerRenderFunctions();
			await this.preloadAssets();

			this.configureRoutes();

			this._isInitialized = true;
		})();
	}

	private configureMiddlewares() {
		this.app.use(compression());
		this.app.use('/assets', express.static(resolve(__client_dirname, 'assets')));
	}

	private configureRoutes() {
		for (const [path, renderConfig] of this.pageRenderConfigs.entries()) {
			this.app.get(path, (req, res) => this.servePage(renderConfig, req, res));
		}
	}

	private async preloadAssets() {
		const renderConfigsDir = resolve(__dist_dirname, 'server/configs');
		for (const file of fs.readdirSync(renderConfigsDir)) {
			const renderConfigFilePattern = /^(?<page>[\w-]+)-ssr\.config\.js$/;
			const match = renderConfigFilePattern.exec(file);
			if (match === null) continue;
			const { page } = match.groups!;

			const renderConfigFile = resolve(renderConfigsDir, file);
			const renderConfig: PageRenderConfig = (await import(renderConfigFile)).default;
			this.pageRenderConfigs.set(renderConfig.path, renderConfig);

			const templateHTMLPath = resolve(__pages_dirname, page, 'index.html');
			const templateHTML = fs.readFileSync(templateHTMLPath, 'utf-8');
			this.templateContents.set(renderConfig.path, templateHTML);

			console.log(`💿 Loaded assets for '${page}' at ${renderConfig.path}`);
		}
	}

	private async loadEntryServerRenderFunctions() {
		this.render = await import(resolve(__dist_dirname, 'server/entry-server.js'));
		console.log(`🔖 Loaded SSR render modules`);
	}

	private servePage(renderConfig: PageRenderConfig, request: Request, response: Response) {
		try {
			const templateHTML = this.templateContents.get(renderConfig.path)!;

			const renderResult = renderConfig.render({
				request,
				templateHTML,
				render: this.render,
			});
			const renderedHTML =
				renderConfig.postprocess?.({
					request,
					templateHTML,
					renderResult,
				}) ?? templateHTML;

			response.status(StatusCodes.OK).type('html').end(renderedHTML);
		} catch (err: any) {
			const shouldAbort = renderConfig.handleError?.(err);
			if (shouldAbort) return;

			const error = err as Error;
			console.error('Failed to render page:', error.stack);
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).end(error.stack);
		}
	}

	public start() {
		const port = process.env.PORT ?? (isProduction ? 3000 : 5173);
		if (!this.isInitialized) {
			return setTimeout(this.start.bind(this));
		}
		this.app.listen(port, (error) => {
			if (error) {
				console.log('❌ Unable to start frontend server:', error);
			} else {
				console.log(`✅ Frontend server ready, listening on port ${port}`);
			}
		});
	}

	public get isInitialized(): boolean {
		return this._isInitialized;
	}
}

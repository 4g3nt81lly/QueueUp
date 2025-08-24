import type { Request } from 'express';
import type { PageRenderFunctions } from './entry-server';

export interface ServerRenderResult {
	head?: string;
	body: string;
}

export type PageRenderAPI = {
	request: Request;
	templateHTML: string;
	render: PageRenderFunctions;
	renderResult: ServerRenderResult;
};

export interface PageRenderConfig {
	readonly path: string;

	render(api: Omit<PageRenderAPI, 'renderResult'>): ServerRenderResult;
	postprocess?(api: Omit<PageRenderAPI, 'render'>): string;
	handleError?(error: any): boolean;
}

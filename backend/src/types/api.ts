import type { NextFunction, Request, Response } from 'express';
import type { Query } from 'express-serve-static-core';
import { Nullable } from './utility';

const supportedHttpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
type HttpMethods = (typeof supportedHttpMethods)[number];

export interface RouterConfig {
	readonly routers: IRouter[];
	readonly middlware?: RouterMiddleware[];
	// TODO: add support for custom error handlers
}

export interface IRouter {
	readonly path: string;
	readonly middleware?: RouterMiddleware[];
	readonly endpoints?: IRouterEndpoint<any>[];
	readonly subrouters?: IRouter[];
}

export interface IRouterEndpoint<ResponseType> {
	readonly path: string;
	readonly method: HttpMethods;
	readonly middlware?: RouterMiddleware[];
	readonly handler: RouterRequestHandler<ResponseType>;
}

export interface IRouterEndpointResponse<T> {
	data: Nullable<T>;
}

export interface IRouterEndpointError {
	error: string;
	message?: string;
}

export type RouterMiddleware<
	ResponseType = void,
	Params = Record<string, string>,
	RequestBody = any,
	RequestQuery = Query,
	ResponseBody = any,
	Info extends Record<string, any> = Record<string, any>,
> = (
	request: Request<Params, ResponseBody, RequestBody, RequestQuery, Info>,
	response: Response<ResponseBody, Info>,
	next: NextFunction
) => ResponseType;

export type RouterRequestHandler<
	ResponseType = any,
	Params = Record<string, string>,
	RequestBody = any,
	RequestQuery = Query,
	ResponseBody = any,
	Info extends Record<string, any> = Record<string, any>,
> = (
	request: Request<Params, ResponseBody, RequestBody, RequestQuery, Info>,
	response: Response<ResponseBody, Info>
) => ResponseType;

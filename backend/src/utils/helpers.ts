import type { Request, Response } from 'express';
import {
	IRouterEndpointError,
	IRouterEndpointResponse,
	RouterRequestHandler,
} from '../types/api';

export function sendErrorResponse(error: any, response: Response) {
	let endpointError: IRouterEndpointError;
	if (error instanceof Error) {
		endpointError = {
			error: error.constructor.name,
			message: error.message,
		};
	} else {
		const { error: name, message } = error as any;
		endpointError = {
			error: name ?? 'UnknownError',
			message: message,
		};
	}
	response.json(endpointError).end();
}

export function makeEndpointRequestHandler(handler: RouterRequestHandler) {
	return async (request: Request, response: Response) => {
		try {
			let endpointResponse: IRouterEndpointResponse<any>;
			let returnValue = await handler(request, response);
			if (returnValue === undefined || returnValue === null) {
				endpointResponse = { data: null };
			} else {
				// attempt to destruct returnValue as IRouterEndpointResponse
				let { data } = returnValue;
				if (data === undefined) {
					data = returnValue;
				}
				endpointResponse = { data };
			}
			response.json(endpointResponse).end();
		} catch (error) {
			sendErrorResponse(error, response);
		}
	};
}

import type { NextFunction, Request, Response } from 'express';
import { customAlphabet } from 'nanoid';
import Constants from '~/shared/constants';
import {
	IRouterEndpointError,
	IRouterEndpointResponse,
	RouterRequestHandler,
	type RouterMiddleware,
} from '../types/api';
import { isPlainObject } from './validation';

export function sendDataResponse(value: any, response: Response) {
	if (value === undefined) return;

	let endpointResponse: IRouterEndpointResponse<any> = {
		message: 'The operation was successful.',
		data: undefined,
	};
	if (isPlainObject(value)) {
		let { message = endpointResponse.message, data, ...extra } = value;
		if (data === undefined) {
			// Payload (return value) does not have a 'data' key
			data = extra;
			extra = {};
		}
		endpointResponse = { message, data, ...extra };
	} else {
		// Other serializable values (hopefully)
		endpointResponse.data = value;
	}
	response.json(endpointResponse).end();
}

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

export function wrapEndpointRequestHandler(handler: RouterRequestHandler) {
	return async (request: Request, response: Response) => {
		try {
			const value = await handler(request, response);
			if (value === undefined) {
				return response.end();
			}
			sendDataResponse(value, response);
		} catch (error) {
			sendErrorResponse(error, response);
		}
	};
}

export function wrapMiddleware(middleware: RouterMiddleware<any>) {
	return async (request: Request, response: Response, next: NextFunction) => {
		try {
			const value = await middleware(request, response, next);
			if (value !== undefined) {
				sendDataResponse(value, response);
			}
		} catch (error) {
			sendErrorResponse(error, response);
		}
	};
}

export function generateQueueRoomCode(): string {
	return customAlphabet(Constants.QROOM_CODE_ALPHABET, Constants.QROOM_CODE_LENGTH)();
}

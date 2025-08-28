import BaseError from './base';

export abstract class ServerError extends BaseError {
	public constructor(message?: string) {
		super(undefined, message);
	}
}

export class NotFoundError extends ServerError {
	public constructor(message?: string) {
		super(message ?? 'The resource cannot be found.');
	}
}

export class InternalServerError extends ServerError {
	public constructor(message?: string) {
		super(message ?? 'An unexpected error occurred on the server.');
	}
}

import BaseError from './base';

export abstract class ServerError extends BaseError {
	public constructor(message?: string) {
		super(undefined, message);
	}
}

export class NotFoundError extends ServerError {}

export class InternalServerError extends ServerError {}

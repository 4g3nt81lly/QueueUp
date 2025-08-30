import BaseError from './base';

export class APIError extends BaseError {
	public constructor(message?: string) {
		super(undefined, message);
	}
}

export class UnauthorizedRequestError extends APIError {
	public constructor(message?: string) {
		super(message ?? 'Unauthorized request.');
	}
}

export class InvalidRequestError extends APIError {}

export class ResourceNotAvailableError extends APIError {}

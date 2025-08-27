import BaseError from './base';

export class APIError extends BaseError {
    public constructor(message?: string) {
        super(undefined, message);
    }
}

export class APIRequestUnauthorizedError extends APIError {}

export class APIRequestInvalidTypeError extends APIError {}

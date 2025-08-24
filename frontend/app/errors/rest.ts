import { BaseAPIError } from './base';

export class APIResponseError extends BaseAPIError {}

export class APIRequestError extends BaseAPIError {}

export class APIRequestCanceledError extends APIRequestError {}

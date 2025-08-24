import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import {
	APIRequestCanceledError,
	APIRequestError,
	APIResponseError,
} from '../../errors/rest';
import type {
	APIEndpointError,
	APIEndpointPayload,
	APIEndpointResponse,
	APIRequestOptions,
} from '../../types/api';
import type { Nullable } from '../../types/utility';
import { isPresent } from '../helpers';

export default class APIRequestController {
	readonly id: string;

	readonly options: APIRequestOptions<any>;
	readonly requestConfig: AxiosRequestConfig<any>;

	private abortController: AbortController;
	private timeoutId: Nullable<number>;

	public constructor(id: string, options: APIRequestOptions<any>) {
		this.id = id;
		this.options = options;
		this.abortController = new AbortController();
		this.requestConfig = this.makeRequestConfig(options);
		this.timeoutId = null;
	}

	private makeRequestConfig(
		options: APIRequestOptions<any>
	): AxiosRequestConfig<any> {
		return {
			signal: this.abortController.signal,
			validateStatus(status) {
				if (options.expectedStatusCodes) {
					return options.expectedStatusCodes.includes(status);
				}
				return status >= 200 && status < 300;
			},
			...(options.requestConfig ?? {}),
		};
	}

	public async dispatch<T, D = any>(
		action: (
			config: AxiosRequestConfig<D>
		) => Promise<AxiosResponse<APIEndpointResponse<T>>>,
		callback?: () => void
	): Promise<T> {
		if (isPresent(this.options.timeout)) {
			this.timeoutId = setTimeout(
				() => this.abortController.abort(),
				this.options.timeout
			);
		}
		let response: AxiosResponse<APIEndpointResponse<T>>;
		try {
			response = await action(this.requestConfig);
			callback?.();
		} catch (error) {
			if (axios.isCancel(error)) {
				throw new APIRequestCanceledError('Request timed out.');
			}
			throw new APIRequestError((error as Error).message);
		}
		const { data: payload } = response.data as APIEndpointPayload<T>;
		if (isPresent(payload)) {
			return payload;
		}
		const { error, message } = response.data as APIEndpointError;
		throw new APIResponseError(message, error);
	}

	public abort() {
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
		this.abortController.abort();
	}
}

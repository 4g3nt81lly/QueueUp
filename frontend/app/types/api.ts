import type { AxiosRequestConfig } from 'axios';

const supportedHttpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
export type HttpMethods = (typeof supportedHttpMethods)[number];

export interface APIRequestOptions<Data> {
	expectedStatusCodes?: number[];
	timeout?: number;
	requestConfig?: AxiosRequestConfig<Data>;
}

export type APIEndpointResponse<T> = APIEndpointPayload<T> | APIEndpointError;

export interface APIEndpointPayload<T> {
	data: T;
}

export interface APIEndpointError {
	error: string;
	message?: string;
}

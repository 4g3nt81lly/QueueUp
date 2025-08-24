import axios, { type AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import type { APIRequestOptions } from '../../types/api';
import type { Nullable } from '../../types/utility';
import { getAccessToken } from '../helpers';
import APIRequestController from './APIRequestController';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class APIController {
	private _api: AxiosInstance;
	private requests: Map<string, APIRequestController>;

	private _getAccessToken: () => Nullable<string>;

	public constructor() {
		this._api = axios.create({
			baseURL: API_BASE_URL,
			withCredentials: true,
		});
		this.requests = new Map();

		this._getAccessToken = getAccessToken;

		this.configureInterceptors();
	}

	public setAuthSource(callback: Nullable<() => Nullable<string>>): APIController {
		this._getAccessToken = callback ?? getAccessToken;
		return this;
	}

	private configureInterceptors() {
		this._api.interceptors.request.use(
			(config) => {
				const accessToken = this._getAccessToken();
				if (accessToken !== null) {
					config.headers.Authorization = `Bearer ${accessToken}`;
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);
	}

	private addRequest(options: APIRequestOptions<any>) {
		let requestId: string;
		do {
			requestId = uuid().toString();
		} while (this.requests.has(requestId));

		const requestController = new APIRequestController(requestId, options);
		this.requests.set(requestId, requestController);

		return requestController;
	}

	private removeRequest(requestId: string) {
		const request = this.requests.get(requestId);
		if (request) {
			request.abort();
			this.requests.delete(requestId);
		}
	}

	public async get<T, D = undefined>(url: string, options: APIRequestOptions<D> = {}): Promise<T> {
		const requestController = this.addRequest(options);
		return requestController.dispatch<T, D>(
			(requestConfig) => this._api.get(url, requestConfig),
			() => this.removeRequest(requestController.id)
		);
	}

	public async post<T, D>(url: string, data?: D, options: APIRequestOptions<D> = {}): Promise<T> {
		const requestController = this.addRequest(options);
		return requestController.dispatch<T, D>(
			(requestConfig) => this._api.post(url, data, requestConfig),
			() => this.removeRequest(requestController.id)
		);
	}

	public async put<T, D>(url: string, data?: D, options: APIRequestOptions<D> = {}): Promise<T> {
		const requestController = this.addRequest(options);
		return requestController.dispatch<T, D>(
			(requestConfig) => this._api.put(url, data, requestConfig),
			() => this.removeRequest(requestController.id)
		);
	}

	public async patch<T, D>(url: string, data?: D, options: APIRequestOptions<D> = {}): Promise<T> {
		const requestController = this.addRequest(options);
		return requestController.dispatch<T, D>(
			(requestConfig) => this._api.put(url, data, requestConfig),
			() => this.removeRequest(requestController.id)
		);
	}

	public async delete<T, D>(url: string, options: APIRequestOptions<D> = {}): Promise<T> {
		const requestController = this.addRequest(options);
		return requestController.dispatch<T, D>(
			(requestConfig) => this._api.delete(url, requestConfig),
			() => this.removeRequest(requestController.id)
		);
	}

	public clear() {
		for (const requestId of this.requests.keys()) {
			this.removeRequest(requestId);
		}
	}

	public get api() {
		// FIXME: simply expose this field for now rather than writing a full wrapper
		return this._api;
	}
}

export default new APIController();

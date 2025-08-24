import { io, Socket } from 'socket.io-client';
import { SocketEmitResponseError, SocketEmitTimeoutError, SocketError } from '../../errors/socket';
import type { SocketResponse } from '../../types/socket';
import type { Nullable } from '../../types/utility';
import { debugLog, getAccessToken, isPresent } from '../helpers';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io';

export class SocketController {
	private _socket: Socket;

	private _getAccessToken: () => Nullable<string>;

	public constructor() {
		if (!SOCKET_URL) {
			throw new SocketError('Missing socket URL.');
		}
		this._socket = io(SOCKET_URL, {
			path: SOCKET_PATH,
			autoConnect: false,
			auth: (callback) => callback({ accessToken: this._getAccessToken() }),
		});
		this._socket.on('connect_error', (error: any) => {
			console.error('Socket connect error:', error.message);
		});

		this._getAccessToken = getAccessToken;
	}

	public connect(onConnect?: (socket: Socket) => void) {
		if (this._socket.connected) return;

		this._socket.connect();
		this._socket.once('connect', () => {
			debugLog(`📡 Connected to socket server as ${this._socket.id}.`);
			onConnect?.(this._socket);
		});
	}

	public disconnect(onDisconnect?: () => void) {
		if (!this._socket.connected) return;

		this._socket.once('disconnect', () => {
			debugLog('⛓️‍💥 Disconnected socket.');
			onDisconnect?.();
		});
		this._socket.disconnect();
	}

	public setAuthSource(callback: Nullable<() => Nullable<string>>): SocketController {
		this._getAccessToken = callback ?? getAccessToken;
		return this;
	}

	public emit(event: string, ...args: any[]): SocketController {
		this._socket.emit(event, ...args);
		return this;
	}

	public async emitWithCallback<ResponseType, ErrorInfo = any>(event: string, timeout: number, ...args: any[]) {
		let response: SocketResponse<ResponseType>;
		try {
			response = await this._socket.timeout(timeout * 1000).emitWithAck(event, ...args);
		} catch {
			throw new SocketEmitTimeoutError(timeout);
		}
		if (isPresent(response.error)) {
			throw new SocketEmitResponseError<ErrorInfo>(response.error!);
		}
		return response.data!;
	}

	public on(event: string, listener: (...args: any[]) => void) {
		this._socket.on(event, listener);
		return this;
	}

	public once(event: string, listener: (...args: any[]) => void) {
		this._socket.once(event, listener);
		return this;
	}

	public off(event: string) {
		this._socket.off(event);
		return this;
	}

	public get socket() {
		// FIXME: simply expose this field for now rather than writing a full wrapper
		return this._socket;
	}

	public get connected() {
		return this._socket.connected;
	}
}

export default new SocketController();

import type { SocketResponseError } from '../types/socket';
import { BaseError } from './base';

export class SocketError extends BaseError {
	public constructor(message: string, name?: string) {
		super(name, message);
	}
}

export class SocketEmitTimeoutError extends SocketError {
	readonly timeout: number;

	public constructor(timeout: number, message?: string) {
		super(message ?? `Emit with callback timed out (${timeout}s).`);
		this.timeout = timeout;
	}
}

export class SocketEmitResponseError<Info = any> extends SocketError {
	readonly info?: Info;

	public constructor(error: SocketResponseError<Info>) {
		super(error.message, error.name);
		this.info = error.info;
	}
}

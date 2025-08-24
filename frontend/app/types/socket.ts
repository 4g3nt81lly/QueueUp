export type SocketResponse<T, R = any> = {
	data?: T;
	error?: SocketResponseError<R>;
};

export type SocketResponseError<T> = {
	name: string;
	message: string;
	info?: T;
};

export abstract class BaseError extends Error {
	public constructor(name?: string, message?: string) {
		super(message ?? 'An error has occurred.');
		this.name = name ?? this.constructor.name;
	}
}

export abstract class BaseAPIError extends BaseError {
	public constructor(message?: string, name?: string) {
		super(name, message);
	}
}

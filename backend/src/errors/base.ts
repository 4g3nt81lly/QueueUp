export default abstract class BaseError extends Error {
	public constructor(name?: string, message?: string) {
		super(message ?? 'An error has occurred.');
		this.name = name ?? this.constructor.name;
	}
}

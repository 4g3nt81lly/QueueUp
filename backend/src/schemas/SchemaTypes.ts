export interface ISendableSchema<T> {
	toData(): T;
}

// FIXME: Dates are currently casted to string when sent to client
export interface ITimestampedSchema {
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

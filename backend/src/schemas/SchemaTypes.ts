export interface ISendableSchema<T> {
	toData(): T;
}

export interface ITimestampedSchema {
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

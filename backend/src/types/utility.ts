export type Nullable<T> = T | null;

export type Sync<Callback extends (...args: any) => any> = (
	...args: Parameters<Callback>
) => Awaited<ReturnType<Callback>>;
export type Async<Callback extends (...args: any) => any> = (
	...args: Parameters<Callback>
) => Promise<ReturnType<Callback>>;

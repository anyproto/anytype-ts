type Fn<T extends readonly unknown[]> = (...args: T) => void;
type Callback<D> = (data: D) => void;
type HeadArgsTuple<F extends Fn<readonly unknown[]>> = F extends Fn<readonly [...infer A, any]> ? A : never;
type CallbackDataType<F extends Fn<readonly unknown[]>> = F extends Fn<readonly [...any, Callback<infer D>]> ? D : never;

export function then<F extends Fn<readonly unknown[]>>(fnWithCallback: F) {
	return (...args: HeadArgsTuple<F>) => new Promise((resolve) => fnWithCallback(...args, (data: CallbackDataType<F>) => {
		resolve(data);
	}));
}
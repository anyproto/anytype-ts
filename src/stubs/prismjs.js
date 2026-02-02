// Create a deep proxy that returns stub values for any property access
const createDeepProxy = () => {
	const noop = () => {};
	const handler = {
		get(target, prop) {
			if (typeof prop === 'symbol') return target[prop];
			if (prop === 'toJSON') return () => ({});
			if (prop === 'valueOf') return () => '';
			if (prop === 'toString') return () => '';
			if (prop === 'length') return 0;
			// Array methods
			if (prop === 'push') return noop;
			if (prop === 'pop') return noop;
			if (prop === 'shift') return noop;
			if (prop === 'unshift') return noop;
			if (prop === 'splice') return noop;
			if (prop === 'slice') return () => [];
			if (prop === 'concat') return () => [];
			if (prop === 'map') return () => [];
			if (prop === 'filter') return () => [];
			if (prop === 'forEach') return noop;
			if (prop === 'find') return noop;
			if (prop === 'findIndex') return () => -1;
			if (prop === 'includes') return () => false;
			if (prop === 'indexOf') return () => -1;
			if (prop === 'join') return () => '';
			// Special Prism.languages methods
			if (prop === 'extend') return () => createDeepProxy();
			if (prop === 'insertBefore') return () => createDeepProxy();
			if (prop === 'DFS') return noop;
			// Return stored value or create new deep proxy
			if (!(prop in target)) {
				target[prop] = createDeepProxy();
			}
			return target[prop];
		},
		set(target, prop, value) {
			target[prop] = value;
			return true;
		}
	};
	return new Proxy({}, handler);
};

const Prism = {
	highlight: (code) => code,
	highlightAll: () => {},
	highlightElement: () => {},
	languages: createDeepProxy(),
	hooks: {
		add: () => {},
		run: () => {},
		all: {},
	},
	Token: class {},
	tokenize: (code) => [code],
	util: {
		encode: (s) => s,
		type: () => 'string',
		clone: (o) => o,
	},
};

// Set global for scripts that expect window.Prism
if (typeof window !== 'undefined') {
	window.Prism = Prism;
}
if (typeof globalThis !== 'undefined') {
	globalThis.Prism = Prism;
}

export const highlight = Prism.highlight;
export const highlightAll = Prism.highlightAll;
export const languages = Prism.languages;
export const hooks = Prism.hooks;

export default Prism;

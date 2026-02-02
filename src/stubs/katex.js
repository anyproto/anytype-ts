const katex = {
	renderToString: () => '',
	render: () => {},
	ParseError: class extends Error {},
	__defineMacro: () => {},
	__defineSymbol: () => {},
	__defineFunction: () => {},
};

export default katex;
export const renderToString = katex.renderToString;
export const render = katex.render;
export const ParseError = katex.ParseError;
export const __defineMacro = katex.__defineMacro;
export const __defineSymbol = katex.__defineSymbol;
export const __defineFunction = katex.__defineFunction;

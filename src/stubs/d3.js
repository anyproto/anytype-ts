const noop = () => ({});
const chainable = () => new Proxy({}, { get: () => chainable });

export const select = chainable;
export const selectAll = chainable;
export const scaleLinear = chainable;
export const forceSimulation = () => ({ nodes: noop, force: chainable, on: noop, stop: noop, alpha: noop });

// Additional d3 exports used in the codebase
export const zoom = chainable;
export const zoomTransform = () => ({ k: 1 });
export const zoomIdentity = { translate: () => ({ scale: () => ({}) }) };
export const drag = chainable;
export const pointer = () => [0, 0];
export const curveLinear = {};

export default {
	select,
	selectAll,
	scaleLinear,
	forceSimulation,
	zoom,
	zoomTransform,
	zoomIdentity,
	drag,
	pointer,
	curveLinear,
};

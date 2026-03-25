/**
 * Mock data factories for Storybook stories.
 * Provides realistic test data for components that need object/block/relation props.
 */

export const mockObject = (overrides: any = {}) => ({
	id: overrides.id || 'mock-object-1',
	name: overrides.name || 'Test Object',
	description: overrides.description || '',
	snippet: overrides.snippet || '',
	iconEmoji: overrides.iconEmoji || '',
	iconImage: overrides.iconImage || '',
	iconOption: overrides.iconOption || 0,
	layout: overrides.layout ?? 0,
	type: overrides.type || 'mock-type-1',
	isDeleted: overrides.isDeleted || false,
	isArchived: overrides.isArchived || false,
	isFavorite: overrides.isFavorite || false,
	done: overrides.done || false,
	globalName: overrides.globalName || '',
	setOf: overrides.setOf || [],
	...overrides,
});

export const mockType = (overrides: any = {}) => ({
	id: overrides.id || 'mock-type-1',
	name: overrides.name || 'Page',
	recommendedLayout: overrides.recommendedLayout ?? 0,
	iconEmoji: overrides.iconEmoji || '',
	isDeleted: overrides.isDeleted || false,
	...overrides,
});

export const mockBlock = (overrides: any = {}) => ({
	id: overrides.id || 'mock-block-1',
	type: overrides.type || 'text',
	parentId: overrides.parentId || '',
	childrenIds: overrides.childrenIds || [],
	fields: overrides.fields || {},
	hAlign: overrides.hAlign ?? 0,
	vAlign: overrides.vAlign ?? 0,
	bgColor: overrides.bgColor || '',
	content: overrides.content || {},
	...overrides,
});

export const mockOption = (id: string, name: string, extra: any = {}) => ({
	id,
	name,
	icon: extra.icon || '',
	color: extra.color || '',
	isSection: extra.isSection || false,
	isDiv: extra.isDiv || false,
	...extra,
});

export const mockOptions = (items: string[]) =>
	items.map((name, i) => mockOption(String(i + 1), name));

export const mockRelation = (overrides: any = {}) => ({
	id: overrides.id || 'mock-relation-1',
	relationKey: overrides.relationKey || 'name',
	name: overrides.name || 'Name',
	format: overrides.format ?? 1,
	isReadonly: overrides.isReadonly || false,
	isHidden: overrides.isHidden || false,
	maxCount: overrides.maxCount || 0,
	...overrides,
});

export const mockParticipant = (overrides: any = {}) => ({
	id: overrides.id || 'mock-participant-1',
	name: overrides.name || 'John Doe',
	globalName: overrides.globalName || '',
	layout: 19, // I.ObjectLayout.Participant
	identity: overrides.identity || 'identity-1',
	...overrides,
});

/**
 * Default props for popup components.
 * The Popup wrapper (popup/index.tsx) passes position, storageGet, storageSet, getId
 * to child popup components. Stories need these to avoid runtime errors.
 */
export const popupProps = (id: string, data: any = {}) => ({
	id,
	param: { data },
	close: () => {},
	position: () => {},
	getId: () => id,
	storageGet: () => ({}),
	storageSet: () => {},
});

/**
 * Set detail store values for a rootId/objectId pair.
 * Usage: setDetail('root-1', 'obj-1', { name: 'Test', layout: 0 });
 */
export const setDetail = (rootId: string, id: string, details: Record<string, any>) => {
	const { S } = require('Lib');
	S.Detail.update(rootId, { id, details }, false);
};

/**
 * Set multiple details at once under the same rootId.
 */
export const setDetails = (rootId: string, items: Array<{ id: string; details: Record<string, any> }>) => {
	items.forEach(item => setDetail(rootId, item.id, item.details));
};

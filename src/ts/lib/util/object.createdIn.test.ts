import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The icons registry pulls in every icon component and breaks under node — stub it out
vi.mock('Component/util/icons', () => ({
	getIconSvg: () => '',
}));

import UtilObject from './object';

// Enum values matching src/ts/interface/object.ts
const L = {
	Page: 0, Task: 2, Set: 3, File: 6, Image: 8, Collection: 14, Chat: 22, Discussion: 27,
};

const relations: any = {
	coverId: { id: 'rel-coverId', relationKey: 'coverId' },
	iconImage: { id: 'rel-iconImage', relationKey: 'iconImage' },
};

const setGlobals = (details: any, currentRootId: string) => {
	(globalThis as any).S = {
		Common: { space: 'space1' },
		Detail: {
			get: (subId: string, id: string) => details[id] || { id, _empty_: true },
		},
		Record: {
			getRelationByKey: (key: string) => relations[key] || null,
			getTypeById: () => null,
			getTypeFeaturedRelations: () => [],
		},
	};
	(globalThis as any).Relation = {
		getStringValue: (v: any) => {
			if ((typeof v === 'object') && v && Object.prototype.hasOwnProperty.call(v, 'length')) {
				v = v.length ? v[0] : '';
			};
			return String(v || '');
		},
		getArrayValue: (v: any) => {
			if (!v) {
				return [];
			};
			return Array.isArray(v) ? v : [ v ];
		},
	};
	(globalThis as any).keyboard = {
		isPopup: () => false,
		getRootId: () => currentRootId,
	};
	(globalThis as any).Preview = {
		toastShow: vi.fn(),
	};
	(globalThis as any).analytics = {
		event: vi.fn(),
	};
	(globalThis as any).translate = (key: string) => key;
};

describe('UtilObject.getCreatedInContextRefKind', () => {

	beforeEach(() => {
		setGlobals({}, '');
	});

	// Table-driven ref semantics: chat layout → message; known relation key → relation;
	// otherwise → block; empty → root
	const table: [ string, number, string, string ][] = [
		[ 'empty ref on a page → root', L.Page, '', 'root' ],
		[ 'empty ref on a chat → root', L.Chat, '', 'root' ],
		[ 'empty ref on a collection → root', L.Collection, '', 'root' ],
		[ 'ref on a chat → message', L.Chat, 'msg-1', 'message' ],
		[ 'ref on a discussion → message', L.Discussion, 'msg-1', 'message' ],
		[ 'known relation key on a page → relation', L.Page, 'coverId', 'relation' ],
		[ 'known relation key on a task → relation', L.Task, 'iconImage', 'relation' ],
		[ 'unknown ref on a page → block', L.Page, 'block-abc', 'block' ],
		[ 'relation-like ref on a chat is still a message', L.Chat, 'coverId', 'message' ],
	];

	for (const [ name, layout, ref, kind ] of table) {
		it(name, () => {
			expect(UtilObject.getCreatedInContextRefKind(layout as any, ref)).toBe(kind);
		});
	};

	it('treats null/undefined ref as root', () => {
		expect(UtilObject.getCreatedInContextRefKind(L.Page as any, null as any)).toBe('root');
		expect(UtilObject.getCreatedInContextRefKind(L.Page as any, undefined as any)).toBe('root');
	});

});

describe('UtilObject.openCreatedInContext', () => {

	let openAuto: any = null;
	let reveal: any = null;

	beforeEach(() => {
		openAuto = vi.spyOn(UtilObject, 'openAuto').mockImplementation(() => {});
		reveal = vi.spyOn(UtilObject, 'revealCreatedInContextRef').mockImplementation(() => {});
	});

	afterEach(() => {
		openAuto.mockRestore();
		reveal.mockRestore();
	});

	it('does nothing without createdInContext', () => {
		setGlobals({}, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1' });

		expect((globalThis as any).Preview.toastShow).not.toHaveBeenCalled();
		expect(openAuto).not.toHaveBeenCalled();
		expect(reveal).not.toHaveBeenCalled();
	});

	it('toasts without navigating when the context details are missing', () => {
		setGlobals({}, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1' });

		expect((globalThis as any).Preview.toastShow).toHaveBeenCalledTimes(1);
		expect(openAuto).not.toHaveBeenCalled();
		expect(reveal).not.toHaveBeenCalled();
	});

	it('toasts without navigating when the context is deleted', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, isDeleted: true } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1' });

		expect((globalThis as any).Preview.toastShow).toHaveBeenCalledTimes(1);
		expect(openAuto).not.toHaveBeenCalled();
	});

	it('toasts without navigating when the context is archived', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, isArchived: true } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1' });

		expect((globalThis as any).Preview.toastShow).toHaveBeenCalledTimes(1);
		expect(openAuto).not.toHaveBeenCalled();
	});

	it('toasts without navigating when the context is in another space', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, spaceId: 'space2' } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1' });

		expect((globalThis as any).Preview.toastShow).toHaveBeenCalledTimes(1);
		expect(openAuto).not.toHaveBeenCalled();
	});

	it('reveals in place without navigating when the context is already open', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, spaceId: 'space1' } }, 'ctx1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1', createdInContextRef: 'block-abc' });

		expect(reveal).toHaveBeenCalledWith('ctx1', 'block-abc', false);
		expect(openAuto).not.toHaveBeenCalled();
		expect((globalThis as any).Preview.toastShow).not.toHaveBeenCalled();
	});

	it('opens the context passing a block ref through _routeParam_.revealRef', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, spaceId: 'space1' } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1', createdInContextRef: 'block-abc' });

		expect(openAuto).toHaveBeenCalledTimes(1);

		const arg = openAuto.mock.calls[0][0];
		expect(arg.id).toBe('ctx1');
		expect(arg._routeParam_).toEqual({ revealRef: 'block-abc' });
	});

	it('opens the context passing a relation ref through _routeParam_.revealRef', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Page, spaceId: 'space1' } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1', createdInContextRef: 'coverId' });

		const arg = openAuto.mock.calls[0][0];
		expect(arg._routeParam_).toEqual({ revealRef: 'coverId' });
	});

	it('opens a chat context passing the ref through _routeParam_.messageId', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Chat, spaceId: 'space1' } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1', createdInContextRef: 'msg-1' });

		const arg = openAuto.mock.calls[0][0];
		expect(arg._routeParam_).toEqual({ messageId: 'msg-1' });
	});

	it('opens the context without a route param when the ref is empty', () => {
		setGlobals({ ctx1: { id: 'ctx1', layout: L.Collection, spaceId: 'space1' } }, 'root1');

		UtilObject.openCreatedInContext({ id: 'file1', createdInContext: 'ctx1', createdInContextRef: '' });

		const arg = openAuto.mock.calls[0][0];
		expect(arg.id).toBe('ctx1');
		expect(arg._routeParam_).toBeUndefined();
	});

});

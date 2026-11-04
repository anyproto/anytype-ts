import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as I from 'Interface';

vi.mock('./virtualBlock', () => ({
	virtualBlock: { resolve: (id: string) => id, isVirtualId: () => false },
}));

import { focus } from './focus';

/**
 * A non-text block shows its focus with an overlay (isKeyboardFocused). The overlay is for a
 * block reached by keyboard or focused by the program. A click on such a block used to store
 * the same state, so the next apply(), e.g. when the window got the focus back, drew the
 * overlay on a block that was only clicked.
 */

const range = { from: 0, to: 0 };

let nodes: Map<string, any>;
let targets: Map<string, Set<string>>;
let active: string;

// The browser moves the DOM focus: the previous block gets a blur event and the new one a focus
// event. A text block clears the focus state on blur, a non-text block sets it on focus.
const domFocus = (id: string) => {
	if (nodes.get(active)?.isText) {
		focus.clear(true);
	};

	active = id;

	if (!nodes.get(id).isText) {
		focus.set(id, range);
	};
};

// The browser sends the focus event again to the focused block when the window gets the focus back
const windowFocus = () => {
	focus.set(active, range);
	focus.restore();
	focus.apply();
};

const click = (id: string) => {
	focus.onMouseDown();
	domFocus(id);
	vi.runAllTimers();
};

const mount = (id: string, isText: boolean) => {
	nodes.set(id, {
		id,
		isText,
		classes: new Set(isText ? [ 'focusable', 'value' ] : [ 'focusable' ]),
		focus: () => {
			if (active != id) {
				domFocus(id);
			};
		},
	});
	targets.set(id, new Set());
};

const hasOverlay = (id: string) => targets.get(id).has('isKeyboardFocused');

beforeEach(() => {
	vi.useFakeTimers();

	nodes = new Map();
	targets = new Map();
	active = '';

	const classesOf = (el: any) => (el instanceof Set ? el : el?.classes) as Set<string>;

	vi.stubGlobal('C', { BlockSetCarriage: () => {} });
	vi.stubGlobal('keyboard', { getRootId: () => 'root', setFocus: () => {} });
	vi.stubGlobal('U', {
		Common: {
			esc: (s: string) => s,
			objectCopy: (o: any) => JSON.parse(JSON.stringify(o)),
		},
		Dom: {
			select: (selector: string) => [ ...nodes.values() ].find(it => selector == `.focusable.c${it.id}`) || null,
			selectAll: (selector: string) => {
				return selector.includes('isKeyboardFocused') ? [ ...targets.values() ].filter(it => it.has('isKeyboardFocused')) : [];
			},
			get: (id: string) => targets.get(id.replace('selectionTarget-', '')) || null,
			hasClass: (el: any, c: string) => !!classesOf(el)?.has(c),
			addClass: (el: any, c: string) => classesOf(el)?.add(c),
			removeClass: (el: any, c: string) => classesOf(el)?.delete(c),
			clearSelection: () => {},
		},
	});

	focus.state = { focused: '', range };
	focus.backup = { focused: '', range };
	focus.isMouseDown = false;

	mount('text', true);
	mount('image', false);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('Focus overlay of a non-text block', () => {

	it('should be drawn for a block focused by the program from a text block', () => {
		domFocus('text');

		focus.set('image', range);
		focus.apply();

		expect(hasOverlay('image')).toBe(true);
	});

	it('should stay after the window gets the focus back', () => {
		domFocus('text');

		focus.set('image', range);
		focus.apply();
		windowFocus();

		expect(hasOverlay('image')).toBe(true);
	});

	it('should not be drawn for a clicked block when the window gets the focus back', () => {
		domFocus('text');
		click('image');

		expect(focus.state.focused).toBe('image');
		expect(focus.state.source).toBe(I.FocusSource.Pointer);

		windowFocus();

		expect(hasOverlay('image')).toBe(false);
	});

	it('should not be drawn after a click on a block that had the focus from the program', () => {
		domFocus('text');

		focus.set('image', range);
		focus.apply();

		// The DOM focus leaves the editor without a change of the focus state
		active = '';
		click('image');
		windowFocus();

		expect(hasOverlay('image')).toBe(false);
	});

	it('should be drawn when the focus is restored to a clicked block by keyboard', () => {
		domFocus('text');
		click('image');

		focus.clear(true);
		active = '';

		focus.restore(I.FocusSource.Program);
		focus.apply();

		expect(hasOverlay('image')).toBe(true);
	});

	it('should not be drawn for a text block', () => {
		focus.set('text', range);
		focus.apply();

		expect(hasOverlay('text')).toBe(false);
	});

});

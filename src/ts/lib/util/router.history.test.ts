import { describe, it, expect, beforeEach, vi } from 'vitest';
import UtilRouter from './router';

/**
 * Regression: the blank route is a placeholder shown while a space loads. It used to be pushed as a
 * real history entry, and keyboard.onBack classifies it as a redirect (isDoubleRedirect) — reacting
 * to a redirect predecessor by slicing history down to the entry before it. So once the user walked
 * back as far as the entry after a leftover blank, their whole history was wiped.
 *
 * These tests pin the entry management: a placeholder replaces the current entry, and the first real
 * navigation after it replaces the placeholder in turn, so it never survives.
 */

// Minimal stand-in for createMemoryHistory: entries + index, push and replace.
const createHistory = () => ({
	entries: [ { pathname: '/' } ],
	index: 0,
	location: { pathname: '/', search: '' },
	push (pathname: string) {
		this.entries = this.entries.slice(0, this.index + 1);
		this.entries.push({ pathname });
		this.index = this.entries.length - 1;
		this.location = { pathname, search: '' };
	},
	replace (pathname: string) {
		this.entries[this.index] = { pathname };
		this.location = { pathname, search: '' };
	},
});

const setGlobals = () => {
	(globalThis as any).S = {
		Common: {
			space: 'space1',
			getRightSidebarState: () => ({ page: '' }),
			redirectSet: vi.fn(),
		},
		Menu: { getTimeout: () => 0, closeAll: vi.fn(), closeAllForced: vi.fn() },
		Popup: { getTimeout: () => 0, closeAll: vi.fn() },
	};
	(globalThis as any).focus = { clear: vi.fn() };
	(globalThis as any).Preview = { hideAll: vi.fn() };
	(globalThis as any).Renderer = { send: vi.fn() };
	(globalThis as any).U = {
		Common: {
			getElectron: () => ({ tabId: () => 'tab1' }),
			esc: (v: any) => String(v ?? ''),
			safeDecodeUri: (v: any) => {
				try {
					return decodeURIComponent(String(v ?? ''));
				} catch {
					return String(v ?? '');
				};
			},
		},
	};
	(globalThis as any).U.Dom = {
		select: () => null,
		selectAll: () => [],
		get: () => null,
		hasClass: () => false,
		clearSelection: () => {},
	};
	(globalThis as any).keyboard = { setFocus: vi.fn() };
	(globalThis as any).sidebar = { rightPanelClose: vi.fn() };
	(globalThis as any).analytics = { event: vi.fn() };
	(globalThis as any).Storage = { set: vi.fn(), get: vi.fn() };
};

const paths = (h: any) => h.entries.map(it => it.pathname);

describe('UtilRouter placeholder history', () => {

	let history: any;

	beforeEach(() => {
		setGlobals();
		history = createHistory();
		UtilRouter.init(history);
		UtilRouter.placeholderEntry = false;
	});

	describe('isPlaceholderRoute', () => {
		it('is true only for the blank route', () => {
			expect(UtilRouter.isPlaceholderRoute('main', 'blank')).toBe(true);
		});

		it('is false for real destinations, including void', () => {
			expect(UtilRouter.isPlaceholderRoute('main', 'chat')).toBe(false);
			expect(UtilRouter.isPlaceholderRoute('main', 'edit')).toBe(false);
			// void pages are somewhere the user actually lands, unlike blank
			expect(UtilRouter.isPlaceholderRoute('main', 'void')).toBe(false);
			expect(UtilRouter.isPlaceholderRoute('auth', 'blank')).toBe(false);
		});
	});

	it('leaves no blank entry behind after a space switch', () => {
		UtilRouter.go('/main/blank', {});
		UtilRouter.go('/main/chat/chat1', {});

		expect(paths(history)).toEqual([ '/main/chat/chat1' ]);
		expect(paths(history)).not.toContain('/main/blank/');
	});

	it('keeps real navigations walkable after a placeholder', () => {
		UtilRouter.go('/main/blank', {});
		UtilRouter.go('/main/chat/chat1', {});
		UtilRouter.go('/main/set/set1', {});
		UtilRouter.go('/main/chat/chat1/messageId/msg1', {});

		// The user's reported sequence: back must walk chat -> set -> chat, with no blank to fall into
		expect(paths(history)).toEqual([
			'/main/chat/chat1',
			'/main/set/set1',
			'/main/chat/chat1/messageId/msg1',
		]);
		expect(history.index).toBe(2);
	});

	it('pushes normally when no placeholder is involved', () => {
		UtilRouter.go('/main/chat/chat1', {});
		UtilRouter.go('/main/set/set1', {});

		expect(paths(history)).toEqual([ '/', '/main/chat/chat1', '/main/set/set1' ]);
	});

	it('still resets history when replace is requested', () => {
		UtilRouter.go('/main/chat/chat1', {});
		UtilRouter.go('/main/set/set1', { replace: true });

		expect(paths(history)).toEqual([ '/main/set/set1' ]);
	});

});

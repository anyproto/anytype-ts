import { describe, it, expect } from 'vitest';
import U, { StickyScrollbarState } from './stickyScrollbar';

const state = (param?: Partial<StickyScrollbarState>): StickyScrollbarState => ({
	isEnabled: true,
	isHovering: false,
	isRecentlyScrolled: false,
	...param,
});

describe('UtilStickyScrollbar.isVisible', () => {

	it('starts hidden when auto-hide is enabled and nothing is active', () => {
		expect(U.isVisible(state())).toBe(false);
	});

	it('always shows when auto-hide is disabled, whatever else is false', () => {
		expect(U.isVisible(state({ isEnabled: false }))).toBe(true);
	});

	it('shows while the pointer is over the block', () => {
		expect(U.isVisible(state({ isHovering: true }))).toBe(true);
	});

	it('shows during and shortly after scrolling', () => {
		expect(U.isVisible(state({ isRecentlyScrolled: true }))).toBe(true);
	});

	it('hides only once hover and scroll activity have both ended', () => {
		expect(U.isVisible(state({ isHovering: true, isRecentlyScrolled: true }))).toBe(true);
		expect(U.isVisible(state({ isHovering: true, isRecentlyScrolled: false }))).toBe(true);
		expect(U.isVisible(state({ isHovering: false, isRecentlyScrolled: true }))).toBe(true);
		expect(U.isVisible(state({ isHovering: false, isRecentlyScrolled: false }))).toBe(false);
	});

	it('keeps the bar visible on non-mac even when idle and unhovered', () => {
		expect(U.isVisible(state({ isEnabled: false, isHovering: false, isRecentlyScrolled: false }))).toBe(true);
	});

});

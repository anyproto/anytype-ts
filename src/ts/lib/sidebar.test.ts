import { describe, it, expect } from 'vitest';
import { getAutoHideDecision, type AutoHideInput } from './sidebar';

/**
 * Regression coverage for the auto-hide ("Automatically show and hide sidebars")
 * bug where opening the widget panel — via header icon or keyboard shortcut — while
 * the cursor sits in the content area (e.g. a chat) collapsed it again immediately.
 *
 * Root cause: the hide decision was purely the cursor's x vs. a fixed boundary, so an
 * explicit open with the pointer already past the boundary hid the panel on the very
 * next mouse move. The `armed` latch only allows auto-hide once the pointer has been
 * over a visible open panel.
 *
 * Geometry (J.Size.sidebar): left.min = 72, default left width = 284, sub-left width = 336.
 * - Hide boundary  = leftWidth + subLeftWidth + (leftClosed ? 0 : leftMin) + 30.
 * - Arm region     = (leftClosed ? 0 : leftWidth) + (subLeftClosed ? 0 : subLeftWidth)
 *                    i.e. the actually-visible panel width — narrower than the hide boundary.
 *
 * The stateful half of the fix — resetting the latch on every open so an explicit
 * open never inherits a stale `armed` from a previous show — lives in
 * leftPanelOpen / leftPanelSubPageOpen and is verified by inspection (those paths are
 * pure DOM/store side-effects). The pure function here owns the position logic.
 */
describe('getAutoHideDecision', () => {

	const LEFT_MIN = 72;

	// Vault closed, widget open → boundary = 284 + 336 + 0 + 30 = 650.
	const widgetOnly = (over: Partial<AutoHideInput>): AutoHideInput => ({
		x: 0,
		leftClosed: true,
		leftWidth: 284,
		subLeftClosed: false,
		subLeftWidth: 336,
		leftMinWidth: LEFT_MIN,
		armed: false,
		popupOpen: false,
		menuOpen: false,
		...over,
	});

	// Vault open + widget open → boundary = 284 + 336 + 72 + 30 = 722.
	const bothOpen = (over: Partial<AutoHideInput>): AutoHideInput => ({
		x: 0,
		leftClosed: false,
		leftWidth: 284,
		subLeftClosed: false,
		subLeftWidth: 336,
		leftMinWidth: LEFT_MIN,
		armed: false,
		popupOpen: false,
		menuOpen: false,
		...over,
	});

	it('does NOT hide a freshly opened widget when the cursor is in the content area (the bug)', () => {
		// Cursor parked in the chat (x past the boundary), latch not yet armed.
		const d = getAutoHideDecision(widgetOnly({ x: 900, armed: false }));

		expect(d.hide).toBe(false);
		expect(d.armed).toBe(false);
	});

	it('does NOT hide both freshly opened panels when the cursor is in the content area', () => {
		const d = getAutoHideDecision(bothOpen({ x: 900, armed: false }));

		expect(d.hide).toBe(false);
		expect(d.armed).toBe(false);
	});

	it('arms the latch once the pointer is over the visible panel', () => {
		// Visible widget spans [0, 336] when the vault is closed.
		const d = getAutoHideDecision(widgetOnly({ x: 200, armed: false }));

		expect(d.armed).toBe(true);
		expect(d.show).toBe(false);
		expect(d.hide).toBe(false);
	});

	it('does NOT arm in the dead zone between the visible panel and the hide boundary', () => {
		// x=400 is right of the visible widget (336) but left of the hide boundary (650):
		// over the content, not the panel — so it must not arm, and must not hide.
		const d = getAutoHideDecision(widgetOnly({ x: 400, armed: false }));

		expect(d.armed).toBe(false);
		expect(d.hide).toBe(false);
	});

	it('stays open across a content-only sweep that never touches the panel', () => {
		// Freshly opened (armed=false); pointer moves through the dead zone and out, never < 336.
		let armed = false;
		for (const x of [ 400, 500, 650, 900 ]) {
			const d = getAutoHideDecision(widgetOnly({ x, armed }));
			armed = d.armed;
			expect(d.hide).toBe(false);
		};
		expect(armed).toBe(false);
	});

	it('hides once armed and the pointer leaves past the boundary', () => {
		const d = getAutoHideDecision(widgetOnly({ x: 900, armed: true }));

		expect(d.hide).toBe(true);
		expect(d.armed).toBe(true);
	});

	it('supports the full hover lifecycle: enter arms, exit hides', () => {
		// Pointer enters the panel.
		const entered = getAutoHideDecision(bothOpen({ x: 150, armed: false }));
		expect(entered.armed).toBe(true);
		expect(entered.hide).toBe(false);

		// Pointer moves out past the boundary → now allowed to hide.
		const left = getAutoHideDecision(bothOpen({ x: 800, armed: entered.armed }));
		expect(left.hide).toBe(true);
	});

	it('shows when the pointer is at the left edge', () => {
		const d = getAutoHideDecision(widgetOnly({ x: 5, armed: false }));

		expect(d.show).toBe(true);
		// The edge is inside the region, so an open panel arms here too.
		expect(d.armed).toBe(true);
	});

	it('disarms when both panels are closed', () => {
		const d = getAutoHideDecision({
			x: 5,
			leftClosed: true,
			leftWidth: 284,
			subLeftClosed: true,
			subLeftWidth: 336,
			leftMinWidth: LEFT_MIN,
			armed: true,
			popupOpen: false,
			menuOpen: false,
		});

		expect(d.armed).toBe(false);
		// Both closed: hovering the edge should still offer to show.
		expect(d.show).toBe(true);
	});

	it('does not show while a popup is open', () => {
		const d = getAutoHideDecision(widgetOnly({ x: 5, popupOpen: true }));

		expect(d.show).toBe(false);
	});

	it('neither shows nor hides while a menu is open', () => {
		const show = getAutoHideDecision(widgetOnly({ x: 5, menuOpen: true }));
		expect(show.show).toBe(false);

		const hide = getAutoHideDecision(widgetOnly({ x: 900, armed: true, menuOpen: true }));
		expect(hide.hide).toBe(false);
	});

	// Guards the reason leftPanelOpen / leftPanelSubPageOpen reset the latch on open:
	// a leaked armed=true (e.g. from a prior show that was closed without a mouse move)
	// combined with a discontinuous first move into the content area would hide a panel
	// the instant it reopened. Resetting armed=false on open prevents exactly this.
	it('would hide on a discontinuous move if armed leaked true (hence the reset-on-open)', () => {
		const leaked = getAutoHideDecision(widgetOnly({ x: 900, armed: true }));
		expect(leaked.hide).toBe(true);

		const reset = getAutoHideDecision(widgetOnly({ x: 900, armed: false }));
		expect(reset.hide).toBe(false);
	});

});

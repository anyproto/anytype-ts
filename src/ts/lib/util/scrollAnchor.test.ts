import { describe, it, expect } from 'vitest';
import { computeRestoreScrollTop, ScrollSettleTracker } from './scrollAnchor';

describe('computeRestoreScrollTop', () => {
	it('subtracts the saved viewport delta from the element content-top', () => {
		expect(computeRestoreScrollTop(1000, 40)).toBe(960);
	});

	it('clamps to zero when the element is above the viewport top', () => {
		expect(computeRestoreScrollTop(10, 40)).toBe(0);
	});
});

describe('ScrollSettleTracker', () => {
	it('continues until N consecutive equal measurements, then stops', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		expect(t.tick(100)).toBe(true);  // first sample, equalCount 0
		expect(t.tick(100)).toBe(true);  // equalCount 1
		expect(t.tick(100)).toBe(false); // equalCount 2 -> settled
	});

	it('resets the equal-run when the measurement changes', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		t.tick(100);
		t.tick(100); // equalCount 1
		expect(t.tick(200)).toBe(true);  // changed -> reset to 0
		expect(t.tick(200)).toBe(true);  // equalCount 1
		expect(t.tick(200)).toBe(false); // equalCount 2 -> settled
	});

	it('stops at the frame cap even if never stable', () => {
		const t = new ScrollSettleTracker({ stableFrames: 99, maxFrames: 3 });
		expect(t.tick(1)).toBe(true);
		expect(t.tick(2)).toBe(true);
		expect(t.tick(3)).toBe(false); // 3rd frame hits maxFrames
	});

	it('stops immediately once disarmed', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		t.tick(100);
		t.disarm();
		expect(t.tick(100)).toBe(false);
		expect(t.active).toBe(false);
	});
});

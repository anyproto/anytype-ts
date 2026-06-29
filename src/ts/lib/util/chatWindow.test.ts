import { describe, it, expect } from 'vitest';
import { evictedCount, reachedEdge, shouldRefetchForward, shouldSuppressLiveAdd } from './chatWindow';

describe('chatWindow', () => {
	it('evictedCount returns overflow past max, else 0', () => {
		expect(evictedCount(550, 500)).toBe(50);
		expect(evictedCount(500, 500)).toBe(0);
		expect(evictedCount(10, 500)).toBe(0);
	});

	it('reachedEdge is true only for a short page', () => {
		expect(reachedEdge(49, 50)).toBe(true);
		expect(reachedEdge(50, 50)).toBe(false);
		expect(reachedEdge(0, 50)).toBe(true);
	});

	it('shouldRefetchForward only when not at end, at window bottom, and not already loading', () => {
		expect(shouldRefetchForward(false, true, false)).toBe(true);
		expect(shouldRefetchForward(true, true, false)).toBe(false);
		expect(shouldRefetchForward(false, false, false)).toBe(false);
		expect(shouldRefetchForward(false, true, true)).toBe(false);
	});

	it('shouldSuppressLiveAdd only for a genuinely-newer message while not at end', () => {
		expect(shouldSuppressLiveAdd(false, '!z', '!m')).toBe(true);
		expect(shouldSuppressLiveAdd(true, '!z', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!a', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!z', '')).toBe(false);
	});
});

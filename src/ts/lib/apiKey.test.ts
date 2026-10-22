import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stands in for the persisted onboarding flags. What those flags are stored as
// is storage.ts's business; here they only have to remember what was set.
const flags = vi.hoisted(() => {
	const seen = new Set<string>();

	return {
		seen,
		getOnboarding: vi.fn((key: string) => seen.has(key)),
		setOnboarding: vi.fn((key: string) => { seen.add(key); }),
	};
});

vi.mock('./storage', () => ({ default: flags }));

import { apiKeyIsNew, apiKeyMarkSeen } from './apiKey';

describe('the API keys "New" badge', () => {

	beforeEach(() => {
		flags.seen.clear();
		flags.getOnboarding.mockClear();
		flags.setOnboarding.mockClear();
	});

	it('marks the settings entry until the page has been opened', () => {
		expect(apiKeyIsNew()).toBe(true);
	});

	it('stops marking it once the page has been opened', () => {
		apiKeyMarkSeen();

		expect(apiKeyIsNew()).toBe(false);
	});

	it('stays unmarked when the page is opened again', () => {
		apiKeyMarkSeen();
		apiKeyMarkSeen();

		expect(apiKeyIsNew()).toBe(false);
	});

	// The sidebar reads the flag and the page writes it. A literal in each file
	// is one typo away from a badge that never clears
	it('reads and writes the same flag', () => {
		apiKeyMarkSeen();
		apiKeyIsNew();

		expect(flags.getOnboarding).toHaveBeenCalledWith(flags.setOnboarding.mock.calls[0][0]);
	});

});

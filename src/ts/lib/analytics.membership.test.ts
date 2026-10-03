import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('amplitude-js', () => ({ default: { getInstance: () => ({}) } }));

import { analytics } from './analytics';

describe('analytics.setProduct', () => {

	let setProperty: ReturnType<typeof vi.fn>;

	const stub = (isStatusKnown: boolean) => vi.stubGlobal('S', {
		Membership: {
			isStatusKnown,
			data: {
				products: [ { product: { id: '4' } } ],
				resolveProduct: () => ({ name: 'Builder', isTopLevel: true, features: { storageBytes: 0, teamSeats: 0 } }),
				getTopProduct: () => ({ name: 'Builder' }),
			},
		},
	});

	beforeEach(() => {
		setProperty = vi.spyOn(analytics, 'setProperty').mockImplementation(() => {}) as any;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('sets nothing while the status is unknown', () => {
		stub(false);
		analytics.setProduct();
		expect(setProperty).not.toHaveBeenCalled();
	});

	it('sets the tier of a known status, resolving embedded products', () => {
		stub(true);
		analytics.setProduct();
		expect(setProperty).toHaveBeenCalledWith(expect.objectContaining({ productTier: 'Builder', extraPurchase: true }));
	});
});

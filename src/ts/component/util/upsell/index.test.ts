import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as I from 'Interface';
import type { MembershipV2_Data, MembershipV2_Product } from 'Proto/pkg/lib/pb/model/protos/models';

const { clicks } = vi.hoisted(() => ({ clicks: [] as (() => void)[] }));

vi.mock('Model', async () => ({
	MembershipProduct: (await import('../../../model/membershipProduct')).default,
	MembershipData: (await import('../../../model/membershipData')).default,
}));

vi.mock('Lib/focus', () => ({ focus: {} }));

// Buttons keep their click handler so a test can press Upgrade
vi.mock('Component', () => ({
	Label: ({ className, text }: { className: string; text: string }) => React.createElement('span', { className }, text),
	Button: ({ text, color, onClick }: { text: string; color: string; onClick: () => void }) => {
		clicks.push(onClick);
		return React.createElement('button', { 'data-color': color }, text);
	},
}));

import { Mapper } from 'Lib/api/mapper';
import Action from 'Lib/action';
import { MembershipStore } from 'Store/membership';
import UpsellBanner from './index';

const Status = I.MembershipResource.Status;
const Products = I.MembershipResource.Products;
const LIMIT = 1024 * 1024 * 1024;

// Typed as the generated messages, so fixtures carry every field the protobuf decoder fills in. The
// generated module is type-only here: its `Object` message shadows the global and fails to load in vitest.
const product = (extra: Partial<MembershipV2_Product> = {}): MembershipV2_Product => ({
	id: '1',
	name: 'Starter',
	description: '',
	isTopLevel: true,
	isHidden: false,
	isIntro: true,
	isUpgradeable: true,
	pricesYearly: [],
	pricesMonthly: [],
	pricesLifetime: [],
	colorStr: 'green',
	offer: '',
	features: { storageBytes: LIMIT, spaceReaders: 0, spaceWriters: 0, sharedSpaces: 3, teamSeats: 0, anyNameCount: 0, anyNameMinLen: 0, privateSpaces: 0 },
	...extra,
});

// isIntro and isUpgradeable vary independently, so mapping one into the other fails a case
const FREE = product();
const PLUS = product({ id: '2', name: 'Plus', isIntro: false });
const PIONEER = product({ id: '3', name: 'Pioneer', isHidden: true, isUpgradeable: false });
const ULTRA = product({ id: '4', name: 'Ultra', isIntro: false, isUpgradeable: false });

// The status embeds the purchased product, the way the middleware sends it
const statusData = (item: MembershipV2_Product): MembershipV2_Data => ({
	products: [ {
		product: item,
		purchaseInfo: { dateStarted: 0, dateEnds: 0, isAutoRenew: false, period: 0 },
		productStatus: { status: I.MembershipStatus.Active as number },
	} ],
	nextInvoice: undefined,
	teamOwnerID: '',
	paymentProvider: 0,
	appliedPromocodes: [],
});

const classes = (html: string): string[] => (html.match(/^<div class="([^"]*)"/)?.[1] || '').split(/\s+/).filter(Boolean);

describe('UpsellBanner', () => {

	let store: MembershipStore;
	let bytesUsed: number;
	let bytesLimit: number;
	let writersLimit: number;
	let editors: number;
	let sharedSpaces: number;

	const setStatus = (item: MembershipV2_Product) => {
		store.applyResult(Status, { fetchState: null, value: Mapper.From.MembershipData(statusData(item)), errorCode: 0 });
	};

	const setCatalog = (...items: MembershipV2_Product[]) => {
		store.applyResult(Products, { fetchState: null, value: items.map(Mapper.From.MembershipProduct), errorCode: 0 });
	};

	const setPlan = (item: MembershipV2_Product) => {
		setCatalog(FREE, PLUS, PIONEER, ULTRA);
		setStatus(item);
	};

	const render = (...components: string[]) => {
		clicks.length = 0;
		return renderToStaticMarkup(React.createElement(UpsellBanner, { components, route: 'test' }));
	};

	beforeEach(() => {
		store = new MembershipStore();
		bytesUsed = LIMIT;
		bytesLimit = LIMIT;
		writersLimit = 4;
		editors = 4;
		sharedSpaces = 3;

		vi.stubGlobal('S', {
			Membership: store,
			Common: { get spaceStorage () { return { bytesLimit, localUsage: 0, spaces: [] }; } },
			Auth: { getNotSynced: () => ({ total: 0 }) },
			Popup: { open: vi.fn() },
		});
		vi.stubGlobal('U', {
			Space: {
				isMyOwner: () => true,
				getSpaceview: () => ({ isOneToOne: false, writersLimit }),
				getParticipantsList: () => Array.from({ length: editors }, (_, i) => ({ isOwner: !i, isWriter: !!i })),
				getMySharedSpacesList: () => Array.from({ length: sharedSpaces }),
				getProfile: () => ({ sharedSpacesLimit: 3 }),
			},
			Data: { isAnytypeNetwork: () => true },
			Common: { calculateStorageUsage: () => bytesUsed },
			String: { sprintf: (text: string, ...args: unknown[]) => [ text, ...args ].join(':') },
		});
		vi.stubGlobal('translate', (key: string) => key);
		vi.stubGlobal('analytics', { event: vi.fn() });
		vi.stubGlobal('Action', Action);
		vi.spyOn(Action, 'openSettings').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe('membership product mapping', () => {

		it.each([
			[ 'Free', FREE, true ],
			[ 'Plus', PLUS, true ],
			[ 'Pioneer', PIONEER, false ],
			[ 'Ultra', ULTRA, false ],
		])('keeps isUpgradeable of %s through the mapper, the catalog and the status', (_name, item, expected) => {
			setPlan(item);

			expect(Mapper.From.MembershipProduct(item).isUpgradeable).toBe(expected);
			expect(store.getProduct(item.id).isUpgradeable).toBe(expected);
			expect(store.data.products[0].product.isUpgradeable).toBe(expected);
			expect(store.data.getTopProduct().isUpgradeable).toBe(expected);
		});
	});

	describe('storage', () => {

		it('shows a Free owner at 100% usage the red warning with Upgrade', () => {
			setPlan(FREE);

			const html = render('storage');

			expect(classes(html)).toEqual(expect.arrayContaining([ 'upsellStorage', 'isRed' ]));
			expect(html).toContain('upsellBannerStorageUsageText:100%');
			expect(html).toContain('>commonUpgrade</button>');
		});

		it('shows the warning for an upgradeable plan that is not the intro one', () => {
			setPlan(PLUS);

			expect(classes(render('storage'))).toEqual(expect.arrayContaining([ 'upsellStorage', 'isRed' ]));
		});

		it('shows the non-red warning above 55% usage', () => {
			setPlan(FREE);
			bytesUsed = LIMIT * 0.6;

			const html = render('storage');

			expect(classes(html)).toContain('upsellStorage');
			expect(classes(html)).not.toContain('isRed');
			expect(html).toContain('>commonUpgrade</button>');
		});

		it('stays hidden at 50% usage', () => {
			setPlan(FREE);
			bytesUsed = LIMIT * 0.5;

			expect(render('storage')).toBe('');
		});

		it.each([
			[ 'Pioneer', PIONEER ],
			[ 'Ultra', ULTRA ],
		])('stays hidden for %s, which is not upgradeable', (_name, item) => {
			setPlan(item);

			expect(render('storage')).toBe('');
		});

		it('reads the product embedded in the status when the catalog is not loaded', () => {
			setStatus(FREE);
			expect(classes(render('storage'))).toContain('isRed');

			setStatus(ULTRA);
			expect(render('storage')).toBe('');
		});

		it('stays hidden while the membership status is unknown', () => {
			setCatalog(FREE);

			expect(store.isStatusKnown).toBe(false);
			expect(render('storage')).toBe('');
		});

		it('stays hidden while the storage limit is unknown', () => {
			setPlan(FREE);
			bytesLimit = 0;

			expect(render('storage')).toBe('');
		});
	});

	describe('members', () => {

		it('shows a Free owner at the editors limit the red warning', () => {
			setPlan(FREE);

			const html = render('members');

			expect(classes(html)).toEqual(expect.arrayContaining([ 'upsellMembers', 'isRed' ]));
			expect(html).toContain('commonUpgrade');
		});

		it('stays hidden for a plan that is not upgradeable', () => {
			setPlan(ULTRA);

			expect(render('members')).toBe('');
		});

		it('stays hidden while the editors limit is unknown', () => {
			setPlan(FREE);
			writersLimit = 0;
			editors = 1;

			expect(render('members')).toBe('');
		});
	});

	describe('share settings', () => {

		it('prefers the red editors warning when both limits are reached', () => {
			setPlan(FREE);

			expect(classes(render('members', 'space'))).toContain('upsellMembers');
		});

		it('still shows the shared channels warning while the editors limit is unknown', () => {
			setPlan(FREE);
			writersLimit = 0;
			editors = 1;

			expect(classes(render('members', 'space'))).toEqual(expect.arrayContaining([ 'upsellSpace', 'isRed' ]));
		});

		it('stays hidden for a plan that is not upgradeable', () => {
			setPlan(ULTRA);

			expect(render('members', 'space')).toBe('');
		});
	});

	describe('shared channels', () => {

		it('shows a Free owner at the shared channels limit the red warning', () => {
			setPlan(FREE);

			const html = render('space');

			expect(classes(html)).toEqual(expect.arrayContaining([ 'upsellSpace', 'isRed' ]));
			expect(html).toContain('commonUpgrade');
		});

		it('stays hidden for a plan that is not upgradeable', () => {
			setPlan(ULTRA);

			expect(render('space')).toBe('');
		});
	});

	describe('Upgrade', () => {

		it('takes a Free owner straight to membership settings', () => {
			setPlan(FREE);
			render('storage');

			expect(clicks).toHaveLength(1);
			clicks[0]();

			expect(Action.openSettings).toHaveBeenCalledWith('membership', '');
			expect(S.Popup.open).not.toHaveBeenCalled();
			expect(analytics.event).toHaveBeenCalledWith('ClickUpgradePlanTooltip', { type: 'StorageWarning', usage: 100, route: 'test' });
		});

		it('asks first when the plan is not upgradeable', () => {
			setPlan(ULTRA);
			Action.membershipUpgrade();

			expect(S.Popup.open).toHaveBeenCalledWith('confirm', expect.anything());
			expect(Action.openSettings).not.toHaveBeenCalled();
		});
	});
});

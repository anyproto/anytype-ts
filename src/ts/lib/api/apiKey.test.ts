import { afterEach, expect, test, vi } from 'vitest';
import { Mapper } from './mapper';
import { AccountLocalLinkCreateApp, AccountLocalLinkUpdateApp } from './command';
import { AccountLocalLinkListApps } from './response';
import { API_KEY_TOOLTIP_MAX_SPACES, apiKeyCreateError, apiKeySpaceTooltip, apiKeySupportsV1, sameLinkGrant } from '../apiKey';

const grant = { spaceIds: [ 'space-b', 'space-a' ], allSpaces: false, perm: 0 };
const now = 2_000_000_000;

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

const setup = () => {
	const request = vi.fn();
	vi.stubGlobal('dispatcher', { request });
	vi.stubGlobal('Mapper', Mapper);
	vi.stubGlobal('translate', (key: string) => key);
	vi.useFakeTimers();
	vi.setSystemTime(now * 1000);
	return request;
};

test('new keys carry a grant and expiry, and always use JsonAPI scope', () => {
	const request = setup();
	AccountLocalLinkCreateApp({ name: ' My integration ', expireAt: now + 86400, grant, scope: 2 } as any);
	expect(request.mock.calls[0].slice(0, 2)).toEqual([ 'AccountLocalLinkCreateApp', {
		app: { appName: ' My integration ', scope: 1, expireAt: now + 86400, grant },
	} ]);
});

test('all current and future spaces is an explicit grant, even for a non-expiring key', () => {
	const request = setup();
	const all = { spaceIds: [], allSpaces: true, perm: 1 };
	AccountLocalLinkCreateApp({ name: 'Integration', grant: all });
	expect(request.mock.calls[0][1].app).toEqual({ appName: 'Integration', scope: 1, expireAt: 0, grant: all });
});

test.each([ undefined, { spaceIds: [], allSpaces: false, perm: 0 }, { ...grant, allSpaces: true } ])('creation cannot mint an unscoped or invalid key', invalid => {
	const request = setup();
	const callback = vi.fn();
	AccountLocalLinkCreateApp({ name: 'Integration', grant: invalid }, callback);
	expect(request).not.toHaveBeenCalled();
	expect(callback).toHaveBeenCalledWith({ error: { code: 2, description: 'apiKeyGrantRequired' } });
});

test('editing targets the app hash and only replaces its grant', () => {
	const request = setup();
	AccountLocalLinkUpdateApp(' existing-hash ', grant);
	expect(request.mock.calls[0].slice(0, 2)).toEqual([ 'AccountLocalLinkUpdateApp', { appHash: ' existing-hash ', grant } ]);
	expect(request.mock.calls[0][1].grant.spaceIds).not.toBe(grant.spaceIds);
});

test.each([ undefined, { ...grant, perm: 99 }, { spaceIds: [], allSpaces: false, perm: 0 } ])('editing never clears a grant or submits invalid permissions', invalid => {
	const request = setup();
	AccountLocalLinkUpdateApp('hash', invalid);
	expect(request).not.toHaveBeenCalled();
});

test('list mapping preserves legacy absence and scoped Read as distinct states', () => {
	vi.stubGlobal('Mapper', Mapper);
	const legacy = { appHash: 'old', appKey: 'same-key', appName: 'Legacy', scope: 1, expireAt: 0 };
	const response = AccountLocalLinkListApps({ app: [ legacy, { ...legacy, appHash: 'new', grant } ] });
	expect(response.list[0].grant).toBeUndefined();
	expect(response.list[1].grant).toEqual(grant);
	expect(response.list[1].apiKey).toBe('same-key');
	expect(response.list[1].grant.spaceIds).not.toBe(grant.spaceIds);
	expect(Mapper.From.AppInfo({ ...legacy, grant: { ...grant, perm: 99 } }).grant.perm).toBe(99);
});

test.each([
	[ undefined, true ],
	[ grant, false ],
	[ { ...grant, perm: 1 }, false ],
	[ { spaceIds: [], allSpaces: true, perm: 0 }, false ],
	[ { spaceIds: [], allSpaces: true, perm: 1 }, true ],
	[ { ...grant, allSpaces: true, perm: 1 }, false ],
])('API v1 compatibility follows the grant, including legacy keys', (value, expected) => {
	expect(apiKeySupportsV1(value as any)).toBe(expected);
});

test('validates the raw name by UTF-8 byte length and expiry as a future timestamp in seconds', () => {
	expect(apiKeyCreateError(' ', grant, 0, now)).toBe('apiKeyNameRequired');
	expect(apiKeyCreateError('é'.repeat(64), grant, now + 1, now)).toBe('');
	expect(apiKeyCreateError('é'.repeat(65), grant, 0, now)).toBe('apiKeyNameTooLong');
	expect(apiKeyCreateError('App', grant, 30 * 86400, now)).toBe('apiKeyExpiryInvalid');
	expect(apiKeyCreateError('App', grant, now, now)).toBe('apiKeyExpiryInvalid');
	expect(apiKeyCreateError('App', grant, -1, now)).toBe('apiKeyExpiryInvalid');
	expect(apiKeyCreateError('App', grant, 0, now)).toBe('');
});

test('selection order does not make an unchanged grant look edited', () => {
	expect(sameLinkGrant(grant, { ...grant, spaceIds: [ 'space-a', 'space-b' ] })).toBe(true);
	expect(sameLinkGrant(grant, { ...grant, perm: 1 })).toBe(false);
	expect(sameLinkGrant(undefined, grant)).toBe(false);
});

test('a grant over many spaces cannot build an unbounded tooltip', () => {
	const names = Array.from({ length: 50 }, (v, i) => `Space ${i + 1}`);

	expect(apiKeySpaceTooltip([])).toBe('');
	expect(apiKeySpaceTooltip([ 'Get Started' ])).toBe('Get Started');
	expect(apiKeySpaceTooltip(names).split(', ').length).toBe(API_KEY_TOOLTIP_MAX_SPACES + 1);
	expect(apiKeySpaceTooltip(names).endsWith(', …')).toBe(true);
	expect(apiKeySpaceTooltip(names).startsWith('Space 1, Space 2, ')).toBe(true);
	expect(apiKeySpaceTooltip(names)).not.toContain('Space 50');

	// The cap itself is not an elision point.
	const exact = names.slice(0, API_KEY_TOOLTIP_MAX_SPACES);
	expect(apiKeySpaceTooltip(exact)).toBe(exact.join(', '));
});

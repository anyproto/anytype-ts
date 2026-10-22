import { afterEach, expect, test, vi } from 'vitest';
import { AccountLocalLinkApproveChallenge } from './command';
import { isValidLinkGrant, linkApprovalGrant } from '../linkApprovalGrant';

afterEach(() => vi.unstubAllGlobals());

test.each([
	{ spaceIds: [ 'space-a', 'space-b' ], allSpaces: false, perm: 0 },
	{ spaceIds: [], allSpaces: true, perm: 1 },
])('the command passes the selected grant and exact caller identity to the RPC', grant => {
	const request = vi.fn();
	vi.stubGlobal('dispatcher', { request });
	AccountLocalLinkApproveChallenge(' /App/Path ', 'https://Example.com', true, grant);
	const [ method, payload ] = request.mock.calls[0];
	expect(method).toBe('AccountLocalLinkApproveChallenge');
	expect(payload.processPath).toBe(' /App/Path ');
	expect(payload.origin).toBe('https://Example.com');
	expect(payload.grant).toEqual(grant);
});

test('deny serializes no grant', () => {
	const request = vi.fn();
	vi.stubGlobal('dispatcher', { request });
	AccountLocalLinkApproveChallenge('', '', false, { spaceIds: [], allSpaces: true, perm: 1 });
	const payload = request.mock.calls[0][1];
	expect(payload.grant).toBeUndefined();
});

test('selecting every current space still grants only those IDs', () => {
	expect(linkApprovalGrant([ 'a', 'b', 'a' ], false, 0)).toEqual({ spaceIds: [ 'a', 'b' ], allSpaces: false, perm: 0 });
	expect(linkApprovalGrant([ 'a', 'b' ], true, 0)).toEqual({ spaceIds: [], allSpaces: true, perm: 0 });
});

test.each([
	undefined,
	{ spaceIds: [], allSpaces: false, perm: 0 },
	{ spaceIds: [ 'a' ], allSpaces: true, perm: 0 },
	{ spaceIds: [ '' ], allSpaces: false, perm: 0 },
	{ spaceIds: [ 'a' ], allSpaces: false, perm: 9 },
])('rejects unusable grants instead of widening them', grant => {
	expect(isValidLinkGrant(grant as any)).toBe(false);
});

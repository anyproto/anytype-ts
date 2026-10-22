import { describe, test, expect } from 'vitest';
import { AccountLocalLinkApproveChallenge } from './response';

describe('AccountLocalLinkApproveChallenge response', () => {

	test('returns the minted code', () => {
		expect(AccountLocalLinkApproveChallenge({ challenge: '3719' })).toEqual({ challenge: '3719' });
	});

	test('returns an empty code when the request was denied', () => {
		expect(AccountLocalLinkApproveChallenge({})).toEqual({ challenge: '' });
	});

});

import { describe, test, expect } from 'vitest';
import { Mapper } from './mapper';

describe('Mapper.Event link approval', () => {

	const clientInfo = {
		processName: 'Claude',
		processPath: '/Applications/Claude.app',
		name: 'My Notes',
		origin: 'chrome-extension://abcdef',
		signatureVerified: false,
	};

	test('detects the request event type from its message property', () => {
		const { type, data } = Mapper.Event.Data({ accountLinkApprovalRequest: { clientInfo, scope: 1 } });

		expect(type).toBe('AccountLinkApprovalRequest');
		expect(data.scope).toBe(1);
	});

	test('maps the request event with client info and scope', () => {
		const mapped = Mapper.Event.AccountLinkApprovalRequest({ clientInfo, scope: 1 });

		expect(mapped).toEqual({ clientInfo, scope: 1, requestedPerm: 0 });
	});

	test('takes only a permission hint from the app, never its space choices', () => {
		const mapped = Mapper.Event.AccountLinkApprovalRequest({
			clientInfo, scope: 1, requestedPerm: 1,
			requestedGrant: { spaceIds: [ 'private' ], allSpaces: true, perm: 1 },
			spaces: [ { id: 'private' } ],
		});

		expect(mapped).toEqual({ clientInfo, scope: 1, requestedPerm: 1 });
		expect(Mapper.Event.AccountLinkApprovalRequest({ requestedPerm: 99 }).requestedPerm).toBe(0);
	});

	test('keeps missing client info fields as empty strings', () => {
		const mapped = Mapper.Event.AccountLinkApprovalRequest({ clientInfo: { name: 'Web Clipper' } });

		expect(mapped.clientInfo).toEqual({
			processName: '',
			processPath: '',
			name: 'Web Clipper',
			origin: '',
			signatureVerified: false,
		});
	});

	test('maps the hide event by client info', () => {
		const mapped = Mapper.Event.AccountLinkApprovalHide({ clientInfo });

		expect(mapped).toEqual({ clientInfo });
	});

});

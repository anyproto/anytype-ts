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

		expect(mapped).toEqual({ clientInfo, scope: 1 });
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

import { describe, test, expect } from 'vitest';
import { approvalLabel, approvalName, approvalSource, NAME_MAX_LENGTH } from './linkApproval';

const info = (param: any) => Object.assign({
	processName: '',
	processPath: '',
	name: '',
	origin: '',
	signatureVerified: false,
}, param);

describe('approvalName', () => {

	test('clamps a caller-supplied name that would blow up the window', () => {
		const name = approvalName(info({ name: 'x'.repeat(500) }));

		expect(name).toHaveLength(NAME_MAX_LENGTH + 1);
		expect(name.endsWith('…')).toBe(true);
	});

	test('keeps a normal name as it arrived', () => {
		expect(approvalName(info({ name: '  My Notes Sync  ' }))).toBe('  My Notes Sync  ');
	});

});

describe('approvalSource', () => {

	test('joins process name and path for a native caller', () => {
		expect(approvalSource(info({ processName: 'curl', processPath: '/usr/bin/curl' }))).toBe('curl — /usr/bin/curl');
	});

	test('appends the browser origin when there is one', () => {
		expect(approvalSource(info({
			processName: 'Google Chrome',
			origin: 'chrome-extension://abcdef',
		}))).toBe('Google Chrome — chrome-extension://abcdef');
	});

	test('never shows the caller-supplied name, which is not attributable', () => {
		expect(approvalSource(info({ name: 'My Notes Sync' }))).toBe('');
	});

});

describe('approvalLabel', () => {

	test('prefers the resolved process name', () => {
		expect(approvalLabel(info({
			processName: 'Claude',
			processPath: '/Applications/Claude.app',
			origin: 'chrome-extension://abcdef',
			name: 'My Notes',
		}))).toBe('Claude');
	});

	test('falls back to the process path when the name could not be resolved', () => {
		expect(approvalLabel(info({ processPath: '/usr/local/bin/sync', name: 'My Notes' }))).toBe('/usr/local/bin/sync');
	});

	test('falls back to the browser origin for extension callers', () => {
		expect(approvalLabel(info({ origin: 'chrome-extension://abcdef', name: 'My Notes' }))).toBe('chrome-extension://abcdef');
	});

	test('falls back to the caller-supplied name when nothing is attributable', () => {
		expect(approvalLabel(info({ name: 'My Notes' }))).toBe('My Notes');
	});

	test('returns an empty label when the caller is fully anonymous', () => {
		expect(approvalLabel(info({}))).toBe('');
	});

});

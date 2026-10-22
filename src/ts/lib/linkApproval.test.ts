import { describe, test, expect } from 'vitest';
import { approvalLabel, approvalName, approvalSource, approvalSpaces, approvalThemeClass, NAME_MAX_LENGTH } from './linkApproval';
import UString from './util/string';

const U = { String: UString };

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

describe('approvalSpaces', () => {
	test('offers only active user spaces, with real space IDs rather than space-view IDs', () => {
		expect(approvalSpaces([
			{ id: 'view-a', targetSpaceId: 'a', name: 'Work', iconEmoji: '📒', isAccountActive: true },
			{ id: 'duplicate', targetSpaceId: 'a', name: 'Work', isAccountActive: true },
			{ targetSpaceId: 'tech', name: 'Account data', isAccountActive: true },
			{ targetSpaceId: 'left', name: 'Left space', isAccountActive: false },
			{ name: 'Incomplete', isAccountActive: true },
		], 'tech')).toEqual([ { id: 'a', name: 'Work', iconEmoji: '📒' } ]);
	});
});

describe('approvalThemeClass', () => {

	// The dark stylesheet is scoped to html.themeDark, but the event carries the raw theme id
	// ('dark'). Setting that straight onto the element matches no rule, so the window renders
	// light while the app is dark.
	test('derives the class the stylesheet targets, not the raw theme id', () => {
		expect(approvalThemeClass('dark')).toBe('themeDark');
	});

	test('treats an absent theme as the light default, with no class', () => {
		expect(approvalThemeClass('')).toBe('');
		expect(approvalThemeClass(undefined)).toBe('');
	});

	test('agrees with the derivation the main window uses', () => {
		[ 'dark', 'light' ].forEach(id => {
			expect(approvalThemeClass(id)).toBe(U.String.toCamelCase(`theme-${id}`));
		});
	});

});

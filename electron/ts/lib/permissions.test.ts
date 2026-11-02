import { describe, it, expect, vi } from 'vitest';
import { isPermissionAllowed, registerPermissionHandlers } from './permissions';

const APP = 'file:///Applications/Anytype.app/Contents/Resources/app.asar/dist/index.html';
const EMBED = 'anytype-embed://app/embed/iframe.html';
const isTrusted = (url: string) => url === APP;
const allowed = (permission: string, url: string) => isPermissionAllowed(permission, url, isTrusted);

describe('isPermissionAllowed', () => {

	it('keeps every permission for the app pages', () => {
		for (const permission of [ 'clipboard-read', 'notifications', 'media', 'openExternal', 'fullscreen' ]) {
			expect(allowed(permission, APP)).toBe(true);
		};
	});

	it('gives embeds and framed pages what players need', () => {
		for (const url of [ EMBED, 'https://www.youtube.com/embed/1' ]) {
			expect(allowed('fullscreen', url)).toBe(true);
			expect(allowed('mediaKeySystem', url)).toBe(true);
			expect(allowed('clipboard-sanitized-write', url)).toBe(true);
		};
	});

	it('denies embeds and framed pages everything else', () => {
		for (const permission of [ 'clipboard-read', 'notifications', 'media', 'geolocation', 'openExternal', 'display-capture', 'unknown' ]) {
			expect(allowed(permission, EMBED)).toBe(false);
			expect(allowed(permission, 'https://codepen.io/pen/1')).toBe(false);
		};
	});

	it('lets only Miro read the clipboard', () => {
		expect(allowed('clipboard-read', 'https://miro.com/app/live-embed/1')).toBe(true);
		expect(allowed('clipboard-read', 'http://miro.com/app/live-embed/1')).toBe(false);
		expect(allowed('clipboard-read', 'https://miro.com.example.org/')).toBe(false);
		expect(allowed('clipboard-read', '')).toBe(false);
	});

});

describe('registerPermissionHandlers', () => {

	const register = () => {
		const ses: any = { setPermissionRequestHandler: vi.fn(), setPermissionCheckHandler: vi.fn() };

		registerPermissionHandlers(ses, isTrusted, APP);
		return {
			request: ses.setPermissionRequestHandler.mock.calls[0][0],
			check: ses.setPermissionCheckHandler.mock.calls[0][0],
		};
	};

	it('answers requests by the frame that asks', () => {
		const { request } = register();
		const callback = vi.fn();

		request(null, 'notifications', callback, { requestingUrl: EMBED, isMainFrame: false });
		request(null, 'notifications', callback, { requestingUrl: APP, isMainFrame: true });

		expect(callback.mock.calls).toEqual([ [ false ], [ true ] ]);
	});

	it('answers checks by the frame url, or its origin when there is none', () => {
		const { check } = register();

		expect(check(null, 'clipboard-read', 'file://', { requestingUrl: APP, isMainFrame: true })).toBe(true);
		expect(check(null, 'clipboard-read', 'https://miro.com', { isMainFrame: false })).toBe(true);
		expect(check(null, 'clipboard-read', 'anytype-embed://app', { isMainFrame: false })).toBe(false);
	});

	it('takes an origin only check as the app\'s when it matches the app page', () => {
		const { check } = register();
		const app = { getURL: () => APP };
		const other = { getURL: () => 'https://example.com/' };

		expect(check(app, 'fileSystem', 'file:///', { isMainFrame: false })).toBe(true);
		expect(check(app, 'fileSystem', 'anytype-embed://app', { isMainFrame: false })).toBe(false);
		expect(check(app, 'fileSystem', 'https://miro.com', { isMainFrame: false })).toBe(false);
		expect(check(other, 'fileSystem', 'https://example.com', { isMainFrame: false })).toBe(false);
	});

	it('takes an origin only check without a page as the app\'s when it has the app origin', () => {
		const { check } = register();

		expect(check(null, 'fileSystem', 'file:///', { isMainFrame: false })).toBe(true);
		expect(check(null, 'fileSystem', 'anytype-embed://app', { isMainFrame: false })).toBe(false);
		expect(check(null, 'fileSystem', 'https://example.com', { isMainFrame: false })).toBe(false);
	});

});

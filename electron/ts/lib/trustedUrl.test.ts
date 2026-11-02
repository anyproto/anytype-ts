import { describe, it, expect } from 'vitest';
import path from 'path';
import { isTrustedUrl, getExternalUrl } from './trustedUrl';

const dev = { isDevelopment: true, port: '8080', appPath: '/app', isWindows: false };
const root = path.resolve(path.sep, 'Applications', 'Anytype.app', 'Contents', 'Resources');
const appPath = path.join(root, 'app.asar');
const prod = { isDevelopment: false, port: '8080', appPath, isWindows: false };
const fileUrl = (...parts: string[]) => 'file://' + path.join(...parts);

describe('isTrustedUrl', () => {

	describe('development', () => {
		it('accepts the dev server', () => {
			expect(isTrustedUrl('http://localhost:8080/tabs.html#/main', dev)).toBe(true);
		});

		it('rejects other hosts, ports and protocols', () => {
			expect(isTrustedUrl('https://example.com/', dev)).toBe(false);
			expect(isTrustedUrl('http://localhost:9999/', dev)).toBe(false);
			expect(isTrustedUrl('https://localhost:8080/', dev)).toBe(false);
			expect(isTrustedUrl('http://localhost.evil.com:8080/', dev)).toBe(false);
		});

		it('rejects blob and data documents', () => {
			expect(isTrustedUrl('blob:http://localhost:8080/1234', dev)).toBe(false);
			expect(isTrustedUrl('data:text/html,<b>x</b>', dev)).toBe(false);
		});

		it('normalizes the configured port', () => {
			expect(isTrustedUrl('http://localhost:8080/tabs.html', { ...dev, port: '08080' })).toBe(true);
		});

		it('handles the default port', () => {
			expect(isTrustedUrl('http://localhost/tabs.html', { ...dev, port: '80' })).toBe(true);
		});
	});

	describe('production', () => {
		it('accepts files inside dist', () => {
			expect(isTrustedUrl(fileUrl(appPath, 'dist', 'tabs.html') + '#/main/edit', prod)).toBe(true);
		});

		it('accepts install paths with a literal percent sign', () => {
			const p = path.join(root, '100%', 'app.asar');

			expect(isTrustedUrl(fileUrl(p, 'dist', 'index.html'), { ...prod, appPath: p })).toBe(true);
		});

		it('accepts install paths containing a pipe', () => {
			const p = path.join(root, 'Anytype|Beta', 'app.asar');

			expect(isTrustedUrl(fileUrl(p, 'dist', 'index.html').replace('|', '%7C'), { ...prod, appPath: p })).toBe(true);
			expect(isTrustedUrl(fileUrl(p, 'dist', 'index.html'), { ...prod, appPath: p })).toBe(true);
		});

		it('accepts install paths containing a caret on Windows', () => {
			const p = path.join(root, 'Anytype^Beta', 'app.asar');

			expect(isTrustedUrl(fileUrl(p, 'dist', 'index.html').replace('^', '%5E'), { ...prod, appPath: p, isWindows: true })).toBe(true);
		});

		it('accepts UNC installs parsed with the server as host', () => {
			const p = '\\\\server\\share\\Anytype\\app.asar';
			const chromium = 'file://server/share/Anytype/app.asar/dist/tabs.html';

			// Only meaningful with Windows path semantics
			if (path.sep === '\\') {
				expect(isTrustedUrl(chromium, { ...prod, appPath: p, isWindows: true })).toBe(true);
				expect(isTrustedUrl('file://server/share/Other/x.html', { ...prod, appPath: p, isWindows: true })).toBe(false);
			};
		});

		it('rejects files outside dist and traversal', () => {
			expect(isTrustedUrl(fileUrl(root, 'evil.html'), prod)).toBe(false);
			expect(isTrustedUrl(fileUrl(appPath, 'dist') + '/../../evil.html', prod)).toBe(false);
			expect(isTrustedUrl(fileUrl(appPath, 'distevil', 'x.html'), prod)).toBe(false);
		});

		it('ignores case on Windows only', () => {
			const url = fileUrl(appPath, 'dist', 'tabs.html').toUpperCase();

			expect(isTrustedUrl(url, { ...prod, isWindows: true })).toBe(true);
			expect(isTrustedUrl(url, prod)).toBe(false);
		});

		it('rejects remote and empty urls', () => {
			expect(isTrustedUrl('https://example.com/', prod)).toBe(false);
			expect(isTrustedUrl('', prod)).toBe(false);
			expect(isTrustedUrl(undefined as any, prod)).toBe(false);
		});
	});

});

describe('getExternalUrl', () => {
	it('allows web and mail links', () => {
		expect(getExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
		expect(getExternalUrl('http://example.com')).toBe('http://example.com');
		expect(getExternalUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
	});

	it('allows object and message links, rebuilt from their fields', () => {
		expect(getExternalUrl('anytype://object?objectId=1&spaceId=2&messageId=3')).toBe('anytype://object?objectId=1&spaceId=2&messageId=3');
		expect(getExternalUrl('anytype://object/?objectId=1&spaceId=2&page=main&action=oneToOne')).toBe('anytype://object?objectId=1&spaceId=2');
	});

	it('rejects other app routes and invites', () => {
		expect(getExternalUrl('anytype://hi/?id=1&key=2')).toBe('');
		expect(getExternalUrl('anytype://invite/?cid=1&key=2')).toBe('');
		expect(getExternalUrl('anytype://main/settings')).toBe('');
		expect(getExternalUrl('anytype://object?objectId=1&cid=2&key=3')).toBe('');
		expect(getExternalUrl('anytype://object?spaceId=2')).toBe('');
	});

	it('rejects native protocol handlers and garbage', () => {
		expect(getExternalUrl('search-ms:query=x')).toBe('');
		expect(getExternalUrl('file:///etc/passwd')).toBe('');
		expect(getExternalUrl('javascript:alert(1)')).toBe('');
		expect(getExternalUrl('not a url')).toBe('');
	});
});

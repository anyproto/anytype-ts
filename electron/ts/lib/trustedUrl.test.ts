import { describe, it, expect } from 'vitest';
import { isTrustedUrl } from './trustedUrl';

const dev = { isDevelopment: true, port: '8080', appPath: '/app', isWindows: false };
const prod = { isDevelopment: false, port: '8080', appPath: '/Applications/Anytype.app/Contents/Resources/app.asar', isWindows: false };

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

		it('handles the default port', () => {
			expect(isTrustedUrl('http://localhost/tabs.html', { ...dev, port: '80' })).toBe(true);
		});
	});

	describe('production', () => {
		it('accepts files inside dist', () => {
			expect(isTrustedUrl('file:///Applications/Anytype.app/Contents/Resources/app.asar/dist/tabs.html', prod)).toBe(true);
		});

		it('rejects files outside dist and traversal', () => {
			expect(isTrustedUrl('file:///etc/passwd', prod)).toBe(false);
			expect(isTrustedUrl('file:///Applications/Anytype.app/Contents/Resources/app.asar/dist/../../evil.html', prod)).toBe(false);
			expect(isTrustedUrl('file:///Applications/Anytype.app/Contents/Resources/app.asar/distevil/x.html', prod)).toBe(false);
		});

		it('rejects remote and empty urls', () => {
			expect(isTrustedUrl('https://example.com/', prod)).toBe(false);
			expect(isTrustedUrl('', prod)).toBe(false);
			expect(isTrustedUrl(undefined as any, prod)).toBe(false);
		});
	});

});

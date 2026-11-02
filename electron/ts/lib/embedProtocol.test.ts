import { describe, it, expect, vi } from 'vitest';
import path from 'path';

vi.mock('electron', () => ({ protocol: {}, net: {} }));

import { resolveEmbedPath, EMBED_ORIGIN } from './embedProtocol';

const dist = path.resolve(path.sep, 'Applications', 'Anytype.app', 'Contents', 'Resources', 'app.asar.unpacked', 'dist');

describe('resolveEmbedPath', () => {

	it('serves the embed folder', () => {
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed/iframe.html?theme=dark`, dist)).toBe(path.join(dist, 'embed', 'iframe.html'));
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed/react.js`, dist)).toBe(path.join(dist, 'embed', 'react.js'));
	});

	it('serves the jQuery loaded by iframe.html', () => {
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/js/jquery.js`, dist)).toBe(path.join(dist, 'js', 'jquery.js'));
	});

	it('rejects the rest of the bundle', () => {
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/index.html`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/js/main.js`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/`, dist)).toBe('');
	});

	it('rejects paths escaping the embed folder', () => {
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed/../index.html`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed/%2e%2e/index.html`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed%2f..%2f..%2fpackage.json`, dist)).toBe('');
		expect(resolveEmbedPath(`${EMBED_ORIGIN}/embed/%00iframe.html`, dist)).toBe('');
	});

	it('rejects other hosts and schemes', () => {
		expect(resolveEmbedPath('anytype-embed://other/embed/iframe.html', dist)).toBe('');
		expect(resolveEmbedPath('file:///embed/iframe.html', dist)).toBe('');
		expect(resolveEmbedPath('not a url', dist)).toBe('');
	});
});

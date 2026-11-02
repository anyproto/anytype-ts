import path from 'path';
import { pathToFileURL } from 'url';
import { protocol, net } from 'electron';

/**
 * Embeds (charts, mini apps, third-party widgets) run code that arrives with synced objects.
 * Served from the app bundle they would share its origin, and an iframe with allow-scripts and
 * allow-same-origin could then reach the privileged window and its preload bridge through `parent`.
 * A separate origin lets the same-origin policy keep them out.
 */
export const EMBED_SCHEME = 'anytype-embed';
export const EMBED_HOST = 'app';
export const EMBED_ORIGIN = `${EMBED_SCHEME}://${EMBED_HOST}`;

/**
 * Maps an embed URL to a file inside dist. Only the embed folder and the jQuery that iframe.html
 * loads are served, anything else (other hosts, paths escaping dist) resolves to an empty string.
 */
export const resolveEmbedPath = (url: string, distPath: string): string => {
	try {
		const u = new URL(url);

		if ((u.protocol !== `${EMBED_SCHEME}:`) || (u.host !== EMBED_HOST)) {
			return '';
		};

		const fp = path.resolve(distPath, '.' + decodeURIComponent(u.pathname));
		const rel = path.relative(distPath, fp);

		if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || rel.includes('\0')) {
			return '';
		};

		const key = rel.split(path.sep).join('/');
		return ((key === 'js/jquery.js') || key.startsWith('embed/')) ? fp : '';
	} catch (e) {
		return '';
	};
};

// Must run before the app is ready
export const registerEmbedScheme = (): void => {
	protocol.registerSchemesAsPrivileged([
		// standard gives embeds a real origin with storage, secure keeps nested https embeds in a secure context
		{ scheme: EMBED_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
	]);
};

export const handleEmbedScheme = (distPath: string): void => {
	protocol.handle(EMBED_SCHEME, async (request: Request) => {
		const fp = resolveEmbedPath(request.url, distPath);

		if (fp) {
			try {
				return await net.fetch(pathToFileURL(fp).toString());
			} catch (e) {};
		};

		return new Response(null, { status: 404 });
	});
};

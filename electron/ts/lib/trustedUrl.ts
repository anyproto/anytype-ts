import path from 'path';

interface TrustedUrlParam {
	isDevelopment: boolean;
	port: string;
	appPath: string;
	isWindows: boolean;
};

/**
 * Whether the URL belongs to the app's own bundle (dev server or packaged dist folder).
 * Anything else must never be navigated to inside a webContents that has the preload bridge attached.
 */
export const isTrustedUrl = (url: string, param: TrustedUrlParam): boolean => {
	if (!url) {
		return false;
	};

	try {
		const u = new URL(url);

		if (param.isDevelopment) {
			// Normalize the configured port the same way the renderer's URL is normalized (default port, leading zeros)
			const port = new URL(`http://localhost:${param.port || 80}`).port || '80';

			return (u.protocol === 'http:') && (u.hostname === 'localhost') && ((u.port || '80') === port);
		};

		if (u.protocol !== 'file:') {
			return false;
		};

		// Compare against the URL exactly as window.ts builds it, so the same normalization applies to both
		// Chromium and Node encode a few path characters differently (e.g. '|'), align both sides
		const fold = (v: string) => (param.isWindows ? v.toLowerCase() : v).replace(/[|^]/g, c => encodeURIComponent(c));
		const dist = new URL('file://' + path.join(param.appPath, 'dist') + path.sep);

		// UNC installs are parsed with the server as host by Chromium and as part of the path by Node, so compare both together
		const key = (v: URL) => fold(v.host ? `//${v.host}${v.pathname}` : v.pathname);

		return key(u).startsWith(key(dist));
	} catch (e) {
		return false;
	};
};

const EXTERNAL_PROTOCOLS = [ 'http:', 'https:', 'mailto:', 'anytype:' ];

/**
 * Whether a URL requested by a page (window.open) may be handed to the OS.
 * The app's own deep links are allowed; other schemes would invoke arbitrary native protocol handlers.
 */
export const isExternalUrlAllowed = (url: string): boolean => {
	try {
		return EXTERNAL_PROTOCOLS.includes(new URL(url).protocol);
	} catch (e) {
		return false;
	};
};

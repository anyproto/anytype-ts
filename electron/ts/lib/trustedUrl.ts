import path from 'path';
import { getObjectLink } from '../../../src/ts/lib/objectLink';

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
		// Chromium and Node encode a few path characters differently (e.g. '|'), align both sides.
		// Encoded before lowercasing, so both sides end up with the same case of the escape
		const fold = (v: string) => {
			v = v.replace(/[|^]/g, c => encodeURIComponent(c));
			return param.isWindows ? v.toLowerCase() : v;
		};
		const dist = new URL('file://' + path.join(param.appPath, 'dist') + path.sep);

		// UNC installs are parsed with the server as host by Chromium and as part of the path by Node, so compare both together
		const key = (v: URL) => fold(v.host ? `//${v.host}${v.pathname}` : v.pathname);

		return key(u).startsWith(key(dist));
	} catch (e) {
		return false;
	};
};

const EXTERNAL_PROTOCOLS = [ 'http:', 'https:', 'mailto:' ];

/**
 * The URL a page may hand to the OS through window.open, empty when none. Other schemes would invoke arbitrary native protocol handlers.
 * The app's own deep links come back into the app as routes, so only plain object links pass, other routes act on arrival (invites, new chats).
 */
export const getExternalUrl = (url: string): string => {
	try {
		if (EXTERNAL_PROTOCOLS.includes(new URL(url).protocol)) {
			return url;
		};
	} catch (e) {
		return '';
	};

	return getObjectLink(url);
};

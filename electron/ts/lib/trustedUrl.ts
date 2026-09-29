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
			return (u.protocol === 'http:') && (u.hostname === 'localhost') && ((u.port || '80') === (param.port || '80'));
		};

		if (u.protocol !== 'file:') {
			return false;
		};

		// Compare against the URL exactly as window.ts builds it, so the same normalization applies to both
		const fold = (v: string) => param.isWindows ? v.toLowerCase() : v;
		const dist = new URL('file://' + path.join(param.appPath, 'dist') + path.sep);

		return fold(u.pathname).startsWith(fold(dist.pathname));
	} catch (e) {
		return false;
	};
};

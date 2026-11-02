import { Session, WebContents } from 'electron';

// Players go fullscreen and play protected media, widgets copy links
const EMBED_PERMISSIONS = [ 'fullscreen', 'mediaKeySystem', 'clipboard-sanitized-write' ];

// Boards that paste from the clipboard, matched on the frame that asks rather than on the block hosting it
const CLIPBOARD_READ_ORIGINS = [ 'https://miro.com' ];

const getOrigin = (url: string): string => {
	try {
		return new URL(url).origin;
	} catch (e) {
		return '';
	};
};

/**
 * Whether a frame may use a browser permission. Electron grants every permission by default,
 * the app's own pages keep that, embeds and the third-party pages framed in them only get what players and boards need.
 */
export const isPermissionAllowed = (permission: string, url: string, isTrusted: (url: string) => boolean): boolean => {
	if (isTrusted(url)) {
		return true;
	};

	if (EMBED_PERMISSIONS.includes(permission)) {
		return true;
	};

	return (permission == 'clipboard-read') && CLIPBOARD_READ_ORIGINS.includes(getOrigin(url));
};

// file:// pages share one origin whatever their host
const isSameOrigin = (a: string, b: string): boolean => {
	try {
		const ua = new URL(a);
		const ub = new URL(b);

		return (ua.protocol == ub.protocol) && ((ua.protocol == 'file:') || (ua.host == ub.host));
	} catch (e) {
		return false;
	};
};

/**
 * The URL a permission is judged by. Some checks (file system access) carry only an origin, some not even a page:
 * the origin is the app's when it matches the trusted page the frame belongs to, or the app page itself when there is no page.
 * Embeds and framed pages always have origins of their own.
 */
export const getRequestingUrl = (webContents: WebContents | null, url: string, origin: string, isTrusted: (url: string) => boolean, appUrl: string): string => {
	if (url) {
		return url;
	};

	const page = String(webContents?.getURL() || appUrl);
	return (isTrusted(page) && isSameOrigin(origin, page)) ? page : origin;
};

// Must run before windows load, checks and requests are answered the same way
export const registerPermissionHandlers = (ses: Session, isTrusted: (url: string) => boolean, appUrl: string): void => {
	ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
		callback(isPermissionAllowed(permission, getRequestingUrl(webContents, details.requestingUrl, '', isTrusted, appUrl), isTrusted));
	});

	ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
		return isPermissionAllowed(permission, getRequestingUrl(webContents, details.requestingUrl, requestingOrigin, isTrusted, appUrl), isTrusted);
	});
};

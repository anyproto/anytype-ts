// Fields an object link carries, in the order the app writes them
const OBJECT_LINK_PARAMS = [ 'spaceId', 'messageId' ];

/**
 * Rebuilds an object link that arrived from synced content (embeds and their popups), empty when it is not a plain object link.
 * Forwarded as it is, any other query parameter could pick a different route, the router merges them over the path,
 * and invite parameters would start a join. Used by both the renderer and the main process.
 */
export const getObjectLink = (url: string): string => {
	try {
		const u = new URL(url);
		const param = u.searchParams;

		let objectId = '';
		let isInvite = true;

		if ((u.protocol == 'anytype:') && (u.host == 'object') && [ '', '/' ].includes(u.pathname)) {
			objectId = param.get('objectId') || '';
			isInvite = !!(param.get('cid') || param.get('key'));
		} else
		if ((u.protocol == 'https:') && (u.host == 'object.any.coop')) {
			objectId = decodeURIComponent(u.pathname.replace(/^\//, ''));
			isInvite = !!(param.get('inviteId') || u.hash.replace(/^#/, ''));
		};

		if (!objectId || isInvite) {
			return '';
		};

		const ret = [ `objectId=${encodeURIComponent(objectId)}` ];

		for (const key of OBJECT_LINK_PARAMS) {
			const value = param.get(key);

			if (value) {
				ret.push(`${key}=${encodeURIComponent(value)}`);
			};
		};

		return `anytype://object?${ret.join('&')}`;
	} catch (e) {
		return '';
	};
};

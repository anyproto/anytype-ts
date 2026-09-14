import type * as I from 'Interface';
import { LocalApiPermission } from '../interface/linkApproval';
import { isValidLinkGrant } from './linkApprovalGrant';

export const API_KEY_NAME_MAX_BYTES = 128;

/** Grant presence, not the key's string format, determines legacy status and API-v1 compatibility. */
export const apiKeySupportsV1 = (grant?: I.LinkAppGrant): boolean => !grant || (
	isValidLinkGrant(grant) && grant.allSpaces && (grant.perm == LocalApiPermission.ReadWrite)
);

export const apiKeyCreateError = (name: string, grant: I.LinkAppGrant, expireAt = 0, now = Math.floor(Date.now() / 1000)): string => {
	if (!String(name || '').trim()) return 'apiKeyNameRequired';
	if (new TextEncoder().encode(name).length > API_KEY_NAME_MAX_BYTES) return 'apiKeyNameTooLong';
	if (!isValidLinkGrant(grant)) return 'apiKeyGrantRequired';
	if (!Number.isSafeInteger(expireAt) || ((expireAt != 0) && (expireAt <= now))) return 'apiKeyExpiryInvalid';
	return '';
};

export const sameLinkGrant = (a?: I.LinkAppGrant, b?: I.LinkAppGrant): boolean => !!a && !!b && (
	(a.allSpaces == b.allSpaces) && (a.perm == b.perm) &&
	(a.spaceIds.length == b.spaceIds.length) && a.spaceIds.every(id => b.spaceIds.includes(id))
);

export const API_KEY_TOOLTIP_MAX_SPACES = 10;

/** Space names for the grant tooltip, capped so a grant over many spaces cannot build an unbounded string. */
export const apiKeySpaceTooltip = (names: string[], max = API_KEY_TOOLTIP_MAX_SPACES): string => {
	const list = names.slice(0, max).join(', ');
	return names.length > max ? `${list}, …` : list;
};

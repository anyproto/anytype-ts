import * as I from 'Interface';

/**
 * Presentation helpers for the local-link approval prompt. Kept apart from the window component so
 * the rules about which parts of a caller's identity can be trusted are testable on their own.
 */

/** The name is chosen by the caller: clamp it so it cannot push the rest of the prompt off screen. */
export const NAME_MAX_LENGTH = 64;

export const approvalName = (clientInfo: I.LinkClientInfo): string => {
	const name = String(clientInfo?.name || '');

	return name.length > NAME_MAX_LENGTH ? `${name.substring(0, NAME_MAX_LENGTH)}…` : name;
};

/**
 * The one identity line of the prompt: everything about the caller that is attributable, in one
 * string. The OS resolves the process, the browser sets the origin; the name is left out, since the
 * caller chose it. Empty when middleware could resolve nothing at all.
 */
export const approvalSource = (clientInfo: I.LinkClientInfo): string => {
	return [ clientInfo?.processName, clientInfo?.processPath, clientInfo?.origin ].filter(it => !!it).join(' — ');
};

/**
 * A single label for the caller, attributable parts first: the OS process for native callers, the
 * browser-set origin for extensions, and only then the name the caller made up. Empty when nothing
 * at all was sent — the prompt shows a generic label in that case.
 */
export const approvalLabel = (clientInfo: I.LinkClientInfo): string => {
	const list = [
		clientInfo?.processName,
		clientInfo?.processPath,
		clientInfo?.origin,
		approvalName(clientInfo),
	];

	return list.find(it => !!it) || '';
};

/** Preserve the vault's ordering while excluding spaces that cannot be granted to an app. */
export const approvalSpaces = (spaces: any[], techSpaceId: string): I.LinkApprovalSpace[] => {
	const seen = new Set<string>();

	return spaces.filter(space => {
		const id = space.targetSpaceId;
		if (!id || (id == techSpaceId) || !space.isAccountActive || seen.has(id)) {
			return false;
		};
		seen.add(id);
		return true;
	}).map(space => ({
		id: space.targetSpaceId,
		name: String(space.name || ''),
		iconEmoji: String(space.iconEmoji || ''),
	}));
};

/**
 * The standalone window sets its own theme class, so it has to derive the same name the app does:
 * addBodyClass('theme', id) camel-cases `theme-<id>`. The event carries the raw id, and an empty
 * one means the light theme, which carries no class.
 */
export const approvalThemeClass = (theme?: string): string => {
	const v = String(theme || '').trim();
	return v ? `theme${v.charAt(0).toUpperCase()}${v.slice(1)}` : '';
};

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

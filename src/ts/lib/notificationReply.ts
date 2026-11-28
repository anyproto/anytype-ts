import * as I from 'Interface';

/**
 * Tells heart these notifications were closed. Every notification heart sent is replied to, including its
 * `isLocal` ones (imports, exports: the reply marks them read, so they don't come back on restart). Only the
 * AI apps nudge, which the renderer creates itself, is unknown to heart and skipped.
 * @param {I.Notification[]} items - The notifications the user closed.
 */
export const notificationReplyClose = (items: I.Notification[]): void => {
	const ids = (items || []).filter(it => it && (it.type != I.NotificationType.AiConnect)).map(it => it.id);

	if (ids.length) {
		C.NotificationReply(ids, I.NotificationAction.Close);
	};
};

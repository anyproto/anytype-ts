/**
 * Pure decision helpers for the chat sliding-window.
 * No store / DOM / global dependencies — keep this module unit-testable.
 */

/**
 * How many messages are evicted when a list of `lengthAfterInsert` is trimmed to `max`.
 * Returns 0 when the list is within bounds.
 */
export const evictedCount = (lengthAfterInsert: number, max: number): number => {
	return Math.max(0, lengthAfterInsert - max);
};

/**
 * A fetched page shorter than the requested `limit` means the chat boundary
 * (oldest when paging back, newest when paging forward) was reached.
 */
export const reachedEdge = (pageLength: number, limit: number): boolean => {
	return pageLength < limit;
};

/**
 * Whether scrolling down should fetch newer messages to refill an evicted tail.
 */
export const shouldRefetchForward = (atChatEnd: boolean, isBottom: boolean, isLoadingNext: boolean): boolean => {
	return (!atChatEnd) && isBottom && (!isLoadingNext);
};

/**
 * Whether a live message must be suppressed: it is genuinely newer than the window's
 * last message while the window is not anchored at the chat end, so appending it would
 * place it out of order after an evicted tail. orderIds are lexids (lexicographic compare).
 */
export const shouldSuppressLiveAdd = (atChatEnd: boolean, messageOrderId: string, lastWindowOrderId: string): boolean => {
	return (!atChatEnd) && (!!lastWindowOrderId) && (messageOrderId > lastWindowOrderId);
};

/**
 * Merge a freshly-fetched window snapshot with the current window. The snapshot was taken
 * on the backend when the request was served, but it is applied only after async dependency
 * loading — events processed in between (live adds, read/sync status, deletes, edits) are
 * newer than the snapshot and must survive the overwrite.
 *
 * - Read/sync flags are effectively monotonic (there is no mark-unread UI): true wins.
 * - Ids deleted by events are filtered out (no resurrection of deleted messages).
 * - Ids touched by content-bearing events (edit / reactions / pin) keep the current
 *   instance — the snapshot predates the event. A touch older than the snapshot is
 *   harmless: the backend had already applied it when the snapshot was taken, so both
 *   sides carry the same content.
 * - With keepTrailing, current messages newer than the snapshot tail are preserved (live
 *   adds during the load). Only valid when the snapshot represents the chat tail; a jump
 *   into history must NOT keep them, or the window would stop being contiguous.
 */
export const mergeWindowSnapshot = (current: any[], snapshot: any[], deletedIds: Set<string>, touchedIds: Set<string>, keepTrailing: boolean): any[] => {
	const filtered = (snapshot || []).filter(it => !deletedIds.has(it.id));
	const byId = new Map((current || []).map(it => [ it.id, it ]));

	const out = filtered.map(it => {
		const cur = byId.get(it.id);
		if (!cur) {
			return it;
		};

		// Touched: current content is fresher, but the snapshot can still carry newer
		// monotonic flags (e.g. read on another device while the edit event was local).
		if (touchedIds.has(it.id)) {
			return {
				...cur,
				isReadMessage: cur.isReadMessage || it.isReadMessage,
				isReadMention: cur.isReadMention || it.isReadMention,
				isReadReaction: cur.isReadReaction || it.isReadReaction,
				isSynced: cur.isSynced || it.isSynced,
			};
		};

		return {
			...it,
			isReadMessage: it.isReadMessage || cur.isReadMessage,
			isReadMention: it.isReadMention || cur.isReadMention,
			isReadReaction: it.isReadReaction || cur.isReadReaction,
			isSynced: it.isSynced || cur.isSynced,
		};
	});

	if (keepTrailing && current && current.length) {
		const ids = new Set(filtered.map(it => it.id));
		const maxOrderId = filtered.length ? filtered[filtered.length - 1].orderId : '';
		const trailing = current.filter(it => (!ids.has(it.id)) && (!deletedIds.has(it.id)) && ((!maxOrderId) || (it.orderId > maxOrderId)));

		out.push(...trailing);
	};

	return out;
};

/**
 * Insertion index for a live-added message so the window stays sorted by orderId.
 * A late-arriving older message (offline peer sync) must land at its ordered position,
 * not at the tail — an unsorted window corrupts pagination cursors, the live-add
 * suppression compare, and author-grouping. Takes the message list directly (no
 * projected orderId array) — this runs per subId per ChatAdd event, and events burst
 * on reconnect catch-up.
 *
 * Returns -1 when the message is older than the window head while older history exists:
 * it belongs outside the loaded window and backward pagination owns fetching it.
 */
export const liveAddIndex = (list: { orderId: string }[], messageOrderId: string, atChatStart: boolean): number => {
	if (!list.length) {
		return 0;
	};

	// Tail fast-path: live traffic is almost always newest-last (O(1)); the binary search
	// below covers late-arriving older messages — the window is sorted by orderId.
	if (list[list.length - 1].orderId < messageOrderId) {
		return list.length;
	};

	let lo = 0;
	let hi = list.length;

	while (lo < hi) {
		const mid = (lo + hi) >> 1;

		if (list[mid].orderId > messageOrderId) {
			hi = mid;
		} else {
			lo = mid + 1;
		};
	};

	if ((lo == 0) && (!atChatStart)) {
		return -1;
	};

	return lo;
};

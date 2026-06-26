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

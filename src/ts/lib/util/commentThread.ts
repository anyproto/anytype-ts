/**
 * Thread placement for object discussions. No store / DOM / global dependencies — keep this
 * module unit-testable.
 *
 * A discussion displays one level: top-level posts, each followed by its thread's replies,
 * flat and in orderId order. `replyToMessageId` may name any message of a thread (Android
 * replies to the tapped message, API agents to the message they answer), so a reply belongs
 * to the thread of the top-level post reached by following `replyToMessageId`.
 */
import { liveAddIndex } from './chatWindow';

export interface ThreadMessage {
	id: string;
	orderId: string;
	replyToMessageId: string;
};

export interface ThreadIndex<T extends ThreadMessage> {
	/** Placed message id → id of its thread's top-level post (a post maps to itself). */
	roots: Map<string, string>;
	/** Id of a parent not seen yet → messages waiting for it. */
	pending: Map<string, T[]>;
};

export interface ThreadPlacement<T extends ThreadMessage> {
	message: T;
	/** Equals `message.id` for a top-level post. */
	rootId: string;
};

export interface ThreadLayout<T extends ThreadMessage> {
	posts: T[];
	replies: Map<string, T[]>;
	index: ThreadIndex<T>;
};

export const newThreadIndex = <T extends ThreadMessage>(): ThreadIndex<T> => ({
	roots: new Map(),
	pending: new Map(),
});

/**
 * Places a message in its thread and returns it with every message that was waiting on it,
 * directly or through other waiting messages, in placement order. Returns nothing when the
 * message is already placed, or when its parent has not been seen: it then waits for the
 * parent. A message whose parent never arrives (deleted before discussions kept tombstones)
 * stays unplaced, and so does a reply cycle, since none of its members gets placed.
 */
export const placeMessage = <T extends ThreadMessage>(index: ThreadIndex<T>, message: T): ThreadPlacement<T>[] => {
	if (index.roots.has(message.id)) {
		return [];
	};

	const parentId = message.replyToMessageId;
	const rootId = parentId ? index.roots.get(parentId) : message.id;

	if (rootId === undefined) {
		const waiting = index.pending.get(parentId);

		if (waiting) {
			waiting.push(message);
		} else {
			index.pending.set(parentId, [ message ]);
		};
		return [];
	};

	const placed: ThreadPlacement<T>[] = [];
	const queue: ThreadPlacement<T>[] = [ { message, rootId } ];

	for (let i = 0; i < queue.length; i++) {
		const item = queue[i];

		// The same id can wait twice when a page repeats a message
		if (index.roots.has(item.message.id)) {
			continue;
		};

		index.roots.set(item.message.id, item.rootId);
		placed.push(item);

		const waiting = index.pending.get(item.message.id);
		if (waiting) {
			index.pending.delete(item.message.id);
			waiting.forEach(child => queue.push({ message: child, rootId: item.rootId }));
		};
	};

	return placed;
};

/**
 * Inserts an item into a list sorted by orderId. The whole discussion is loaded, so there is no
 * window edge. An item without an orderId is an own message inserted before its ChatAdd event
 * (the ChatAddMessage response carries no orderId): it is the newest, so it goes last.
 */
export const insertByOrder = <T extends { orderId: string }>(list: T[], item: T): void => {
	if (!item.orderId) {
		list.push(item);
		return;
	};

	list.splice(liveAddIndex(list, item.orderId, true), 0, item);
};

/** orderId order, with an own message that has no orderId yet last, as insertByOrder puts it. */
const compareOrder = (a: ThreadMessage, b: ThreadMessage): number => {
	if (!a.orderId || !b.orderId) {
		return Number(!a.orderId) - Number(!b.orderId);
	};
	return (a.orderId < b.orderId) ? -1 : ((a.orderId > b.orderId) ? 1 : 0);
};

/** Lays out a fully loaded discussion: posts and per-post reply lists, each in orderId order. */
export const buildThreads = <T extends ThreadMessage>(messages: T[]): ThreadLayout<T> => {
	const index = newThreadIndex<T>();
	const posts: T[] = [];
	const replies = new Map<string, T[]>();
	const sorted = [ ...messages ].sort(compareOrder);

	for (const message of sorted) {
		for (const { message: placed, rootId } of placeMessage(index, message)) {
			if (rootId == placed.id) {
				insertByOrder(posts, placed);
				continue;
			};

			let list = replies.get(rootId);
			if (!list) {
				list = [];
				replies.set(rootId, list);
			};
			insertByOrder(list, placed);
		};
	};

	return { posts, replies, index };
};

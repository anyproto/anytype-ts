import React, { useEffect, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { StatusGroup, StatusFooter, TypingIndicator, activePublishers } from 'Component/block/chat/status';
import { ChatStatusScope, STATUS_TTL } from 'Lib/chatStatus/model';
import { discussionActivity } from 'Lib/chatStatus/timeline';

interface Props {
	discussionId: string;
	subId: string;
	/** Top-level post whose thread this is; empty for the discussion level. */
	threadId?: string;
	onResize?: () => void;
};

const getScope = (discussionId: string): ChatStatusScope => ({ accountId: S.Auth.account?.id || '', spaceId: S.Common.space, chatId: discussionId });

/** Where typing and agent activity of a discussion go: see discussionActivity. */
const getPlacement = (scope: ChatStatusScope, subId: string) => {
	const view = S.ChatStatus.get(scope);

	return discussionActivity(Array.from(view.groups.values()), view.live, S.Presence.getTypers(scope.chatId), {
		threadOf: id => S.Comment.getThreadRoot(subId, id),
		isDeleted: id => !!S.Comment.getById(subId, id)?.isDeleted,
	});
};

/**
 * Live activity at the end of a thread, or at the discussion level: people typing, agent status
 * text and the agent runs that have not produced their comment yet, each one compact line.
 */
const CommentActivity = (props: Props) => {

	const { discussionId, subId, threadId = '', onResize } = props;
	const [ clock, setClock ] = useState(Date.now);
	const now = Math.max(clock, Date.now());
	const scope = getScope(discussionId);
	const view = S.ChatStatus.get(scope);
	const placement = discussionId ? getPlacement(scope, subId) : null;
	const bucket = threadId ? placement?.threads.get(threadId) : placement?.root;
	const groups = bucket?.groups || [];
	const live = (bucket?.live || []).filter(it => !it.itemId && (now - it.lastSeenAt <= STATUS_TTL));
	const rich = activePublishers(view.live, view.items.values(), now);
	const typers = (bucket?.typers || []).map(it => it.identity).filter(it => !rich.has(it));
	const isFresh = !!live.length || groups.some(group => group.itemIds.some(id => {
		const item = view.items.get(id);
		return item?.fresh && (item.lifecycle == 'in_progress') && (now - item.lastSeenAt <= STATUS_TTL);
	}));
	const isEmpty = !groups.length && !live.length && !typers.length;
	const signature = [ groups.length, live.length, typers.length ].join(':');

	// Expiry is by receiver clock: tick while anything here can still go stale
	useEffect(() => {
		if (!isFresh) {
			return;
		};

		const timer = window.setInterval(() => setClock(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [ isFresh ]);

	useLayoutEffect(() => {
		onResize?.();
	}, [ signature ]);

	if (isEmpty) {
		return null;
	};

	return (
		<div className="commentActivity">
			{groups.map(group => (
				<StatusGroup key={group.id} scope={scope} groupId={group.id} now={now} isCompact={true} />
			))}
			<StatusFooter scope={scope} live={live} now={now} />
			<TypingIndicator spaceId={scope.spaceId} identities={typers} />
		</div>
	);

};

/** The finished agent runs that produced a comment, one compact line under its head. */
export const CommentActivityAttached = observer(({ discussionId, subId, messageId }: { discussionId: string; subId: string; messageId: string }) => {
	if (!discussionId) {
		return null;
	};

	const scope = getScope(discussionId);
	const groups = getPlacement(scope, subId).attached.get(messageId) || [];

	if (!groups.length) {
		return null;
	};

	return (
		<div className="commentActivity isAttached">
			{groups.map(group => (
				<StatusGroup key={group.id} scope={scope} groupId={group.id} now={Date.now()} isCompact={true} withAuthor={false} />
			))}
		</div>
	);
});

export default CommentActivity;

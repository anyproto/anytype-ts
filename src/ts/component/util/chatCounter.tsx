import React, { forwardRef } from 'react';
import { Icon } from 'Component';
import { I, S, U } from 'Lib';

interface Props {
	spaceId?: string;
	chatId?: string;
	className?: string;
};

const ChatCounter = forwardRef<HTMLDivElement, Props>((props, ref) => {

	const { spaceId = S.Common.space, chatId, className = '' } = props;
	const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);

	let counters = { mentionCounter: 0, messageCounter: 0 };
	let mode = I.NotificationMode.All;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		mode = U.Object.getChatNotificationMode(spaceview, chatId);
	} else {
		counters = S.Chat.getSpaceCounters(spaceId);
		mode = spaceview.notificationMode;
	};

	const { mentionCounter, messageCounter } = counters;

	if (!mentionCounter && !messageCounter) {
		return null;
	};

	const cn = [ 'chatCounter', className ];
	const cnMention = [ 'mention' ];
	const cnMessage = [ 'message' ];

	if (mode == I.NotificationMode.Nothing) {
		cnMention.push('isMuted');
	};
	if ([ I.NotificationMode.Mentions, I.NotificationMode.Nothing ].includes(mode)) {
		cnMessage.push('isMuted');
	};

	return (
		<div className={cn.join(' ')}>
			{mentionCounter ? <Icon className={cnMention.join(' ')} /> : ''}
			{messageCounter ? <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} /> : ''}
		</div>
	);
});

export default ChatCounter;
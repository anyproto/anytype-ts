import React, { forwardRef } from 'react';
import { Icon } from 'Component';
import { I, S } from 'Lib';

interface Props {
	mentionCounter: number;
	messageCounter: number;
	mode?: I.NotificationMode;
	className?: string;
};

const ChatCounter = forwardRef<HTMLDivElement, Props>(({
	mentionCounter = 0,
	messageCounter = 0,
	mode = I.NotificationMode.All,
	className = '',
}, ref) => {

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
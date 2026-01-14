import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U } from 'Lib';

interface Props {
	spaceId?: string;
	chatId?: string;
	className?: string;
	disableMention?: boolean;
};

const ChatCounter = observer(forwardRef<HTMLDivElement, Props>((props, ref) => {

	const { spaceId = S.Common.space, chatId, className = '', disableMention } = props;
	const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);

	let counters = { mentionCounter: 0, messageCounter: 0 };
	let mode = I.NotificationMode.All;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		mode = U.Object.getChatNotificationMode(spaceview, chatId);
	} else {
		counters = S.Chat.getSpaceCounters(spaceId);

		if (disableMention) {
			counters.messageCounter = counters.messageCounter + counters.mentionCounter;
			counters.mentionCounter = 0;
		};

		if (counters.messageCounter || counters.mentionCounter) {
			const spaceMap = S.Chat.stateMap.get(spaceId);

			mode = I.NotificationMode.Nothing;

			if (spaceMap) {
				for (const [ chatId, state ] of spaceMap) {
					if (!chatId) {
						continue;
					};

					const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

					if (state.messageCounter && (chatMode == I.NotificationMode.All)) {
						mode = I.NotificationMode.All;
						break;
					} else
					if (state.mentionCounter && ([ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode))) {
						mode = I.NotificationMode.Mentions;
						break;
					};
				};
			};
		};
	};

	const { mentionCounter, messageCounter } = counters;
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
			{mentionCounter && !spaceview.isOneToOne ? <Icon className={cnMention.join(' ')} /> : ''}
			{messageCounter ? <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} /> : ''}
		</div>
	);

}));

export default ChatCounter;
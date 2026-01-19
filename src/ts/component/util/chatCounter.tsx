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
	let mode = I.NotificationMode.Nothing;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		if (spaceview) {
			mode = U.Object.getChatNotificationMode(spaceview, chatId);
		};
	} else {
		const spaceMap = S.Chat.stateMap.get(spaceId);
		const mutedCounters = { mentionCounter: 0, messageCounter: 0 };

		if (spaceMap && spaceview) {
			for (const [ chatId, state ] of spaceMap) {
				if (!chatId) {
					continue;
				};

				const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

				if (state.messageCounter) {
					if (chatMode == I.NotificationMode.All) {
						mode = I.NotificationMode.All;
						counters.messageCounter += Number(state.messageCounter) || 0;
					} else if (chatMode == I.NotificationMode.Nothing) {
						mutedCounters.messageCounter += Number(state.messageCounter) || 0;
					};
				};

				if (state.mentionCounter) {
					if ([ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode)) {
						if (mode == I.NotificationMode.Nothing) {
							mode = I.NotificationMode.Mentions;
						};
						counters.mentionCounter += Number(state.mentionCounter) || 0;
					} else if (chatMode == I.NotificationMode.Nothing) {
						mutedCounters.mentionCounter += Number(state.mentionCounter) || 0;
					};
				};
			};
		};

		// If no non-muted notifications, show muted counters in grey
		if (mode == I.NotificationMode.Nothing) {
			counters.messageCounter = mutedCounters.messageCounter;
			counters.mentionCounter = mutedCounters.mentionCounter;
		};

		if (disableMention) {
			counters.messageCounter = counters.messageCounter + counters.mentionCounter;
			counters.mentionCounter = 0;
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

	const isOneToOne = spaceview?.isOneToOne;

	return (
		<div className={cn.join(' ')}>
			{mentionCounter && !isOneToOne ? <Icon className={cnMention.join(' ')} /> : ''}
			{messageCounter ? <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} /> : ''}
		</div>
	);

}));

export default ChatCounter;
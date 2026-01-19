import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, J } from 'Lib';

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
	let modeMessage = I.NotificationMode.Nothing;
	let modeMention = I.NotificationMode.Nothing;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		if (spaceview) {
			const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

			modeMessage = chatMode;
			modeMention = chatMode;
		};
	} else {
		const spaceMap = S.Chat.stateMap.get(spaceId);

		if (spaceMap && spaceview) {
			for (const [ chatId, state ] of spaceMap) {
				if (!chatId || U.Data.checkIsArchived(chatId)) {
					continue;
				};

				const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

				if (state.messageCounter && [ I.NotificationMode.All ].includes(chatMode)) {
					modeMessage = chatMode;
				};

				if (state.mentionCounter && [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode)) {
					modeMention = chatMode;
				};

				counters.messageCounter += Number(state.messageCounter) || 0;
				counters.mentionCounter += Number(state.mentionCounter) || 0;
			};
		};
	};

	const { mentionCounter, messageCounter } = counters;
	const cn = [ 'chatCounter', className ];
	const cnMention = [ 'mention' ];
	const cnMessage = [ 'message' ];
	const showMention = mentionCounter && !spaceview?.isOneToOne && !disableMention;

	if (modeMention == I.NotificationMode.Nothing) {
		cnMention.push('isMuted');
	};
	if ([ I.NotificationMode.Mentions, I.NotificationMode.Nothing ].includes(modeMessage)) {
		cnMessage.push('isMuted');
	};

	return (
		<div className={cn.join(' ')}>
			{showMention ? <Icon className={cnMention.join(' ')} /> : ''}
			{messageCounter ? <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} /> : ''}
		</div>
	);

}));

export default ChatCounter;
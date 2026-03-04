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

	let counters = { mentionCounter: 0, messageCounter: 0, reactionCounter: 0 };
	let modeMessage = I.NotificationMode.Nothing;
	let modeMention = I.NotificationMode.Nothing;
	let modeReaction = I.NotificationMode.Nothing;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		if (spaceview) {
			const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

			modeMessage = chatMode;
			modeMention = chatMode;
			modeReaction = chatMode;
		};
	} else {
		const spaceMap = S.Chat.stateMap.get(spaceId);

		if (spaceMap && spaceview) {
			for (const [ chatId, state ] of spaceMap) {
				if (!chatId || U.Data.checkIsArchived(chatId)) {
					continue;
				};

				const chatMode = U.Object.getChatNotificationMode(spaceview, chatId);

				if (state.mentionCounter && [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode)) {
					counters.mentionCounter += Number(state.mentionCounter) || 0;
					modeMention = chatMode;
				};

				if (state.messageCounter && [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode)) {
					counters.messageCounter += Number(state.messageCounter) || 0;
					modeMessage = chatMode;
				};

				if (state.reactionCounter && [ I.NotificationMode.All, I.NotificationMode.Mentions ].includes(chatMode)) {
					counters.reactionCounter += Number(state.reactionCounter) || 0;
					modeReaction = chatMode;
				};
			};
		};
	};

	const { mentionCounter, messageCounter, reactionCounter } = counters;
	const cn = [ 'chatCounter', className ];
	const cnMention = [ 'mention' ];
	const cnMessage = [ 'message' ];
	const cnReaction = [ 'reaction' ];
	const showMention = mentionCounter && !spaceview?.isOneToOne && !disableMention;
	const showMessage = messageCounter && (modeMessage != I.NotificationMode.Nothing);
	const showReaction = reactionCounter && (modeReaction != I.NotificationMode.Nothing);

	if (modeMention == I.NotificationMode.Nothing) {
		cnMention.push('isMuted');
	};
	if ([ I.NotificationMode.Mentions, I.NotificationMode.Nothing ].includes(modeMessage)) {
		cnMessage.push('isMuted');
	};
	if ([ I.NotificationMode.Mentions, I.NotificationMode.Nothing ].includes(modeReaction)) {
		cnReaction.push('isMuted');
	};

	if (!showMention && !showMessage && !showReaction) {
		return null;
	};

	return (
		<div className={cn.join(' ')}>
			{showReaction ? <Icon className={cnReaction.join(' ')} /> : ''}
			{showMention ? <Icon className={cnMention.join(' ')} /> : ''}
			{showMessage ? <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} /> : ''}
		</div>
	);

}));

export default ChatCounter;
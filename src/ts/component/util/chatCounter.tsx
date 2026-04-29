import React, { forwardRef } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	spaceId?: string;
	chatId?: string;
	mode?: I.NotificationMode;
	className?: string;
	isMinimal?: boolean;
};

const ChatCounter = forwardRef<HTMLDivElement, Props>((props, ref) => {

	const { spaceId = S.Common.space, chatId, mode, className = '', isMinimal = false } = props;
	const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);

	let counters = { mentionCounter: 0, messageCounter: 0, reactionCounter: 0 };
	let modeMessage = I.NotificationMode.Nothing;
	let modeMention = I.NotificationMode.Nothing;
	let modeReaction = I.NotificationMode.Nothing;

	if (chatId) {
		counters = S.Chat.getChatCounters(spaceId, chatId);
		if (spaceview) {
			const chatMode = (mode !== undefined) ? mode : U.Object.getChatNotificationMode(spaceview, chatId);

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
	const showMention = mentionCounter && !spaceview?.isOneToOne;
	const showMessage = messageCounter && (modeMessage != I.NotificationMode.Nothing);
	const showReaction = reactionCounter;

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

	const iconMention = <Icon name="counter/mention" size={10} className={cnMention.join(' ')} />;
	const iconMessage = <Icon className={cnMessage.join(' ')} inner={S.Chat.counterString(messageCounter)} />;
	const iconReaction = <Icon name="counter/reaction" size={10} className={cnReaction.join(' ')} />;

	let content = null;

	if (isMinimal) {
		if (showMention) {
			content = iconMention;
		} else 
		if (showMessage) {
			content = iconMessage;
		} else 
		if (showReaction) {
			content = iconReaction;
		};
	} else {
		content = (
			<>
				{showReaction ? iconReaction : ''}
				{showMention ? iconMention : ''}
				{showMessage ? iconMessage : ''}
			</>
		);
	};

	return (
		<div className={cn.join(' ')}>
			{content}
		</div>
	);

});

export default ChatCounter;
import React, { forwardRef, memo } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { I, S, U, Preview } from 'Lib';

interface Props extends I.ChatMessageReaction, I.ChatMessageComponent {
	onSelect: (icon: string) => void;
};

const ChatMessageReactionBase = observer(forwardRef<{}, Props>((props, ref) => {

	const { account } = S.Auth;
	const { space } = S.Common;
	const { icon, authors, onSelect } = props;
	const mapped = authors.map(it => U.Space.getParticipant(U.Space.getParticipantId(space, it))).filter(it => it);
	const tooltip = mapped.map(it => it.name).filter(it => it).join('\n');
	const length = authors.length;
	const author = length ? U.Space.getParticipant(U.Space.getParticipantId(space, authors[0])) : '';
	const isMe = authors.includes(account.id);
	const cn = [ 'reaction' ];

	if (isMe) {
		cn.push('isMe');
	};
	if (length > 1) {
		cn.push('isMulti');
	};

	return (
		<div 
			className={cn.join(' ')}
			onClick={() => onSelect(icon)}
			onMouseEnter={e => Preview.tooltipShow({ text: tooltip, element: $(e.currentTarget) })}
			onMouseLeave={() => Preview.tooltipHide(false)}
		>
			<div className="value">
				<IconObject object={{ iconEmoji: icon }} size={18} />
			</div>
			<div className="count">
				{length > 1 ? length : <IconObject object={author} size={18} />}
			</div>
		</div>
	);

}));

const ChatMessageReaction = memo(ChatMessageReactionBase, (prev, next) => {
	return (prev.icon == next.icon) && (prev.authors === next.authors);
});

export default ChatMessageReaction;
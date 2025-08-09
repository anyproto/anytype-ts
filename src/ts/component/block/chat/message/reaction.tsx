import React, { forwardRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { I, S, U, Preview } from 'Lib';

interface Props extends I.ChatMessageReaction, I.ChatMessageComponent {
	onSelect: (icon: string) => void;
};

const ChatMessageReaction = observer(forwardRef<{}, Props>((props, ref) => {

	const { account } = S.Auth;
	const { space } = S.Common;
	const { icon, authors, onSelect } = props;
	const mapped = authors.map(it => U.Space.getParticipant(U.Space.getParticipantId(space, it))).filter(it => it);
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

	const onMouseEnter = (e: MouseEvent) => {
		Preview.tooltipShow({ 
			text: mapped.map(it => it.name).filter(it => it).join('\n'), 
			element: $(e.currentTarget),
		});
	};

	const onMouseLeave = (e: MouseEvent) => {
		Preview.tooltipHide(false);
	};

	return (
		<div 
			className={cn.join(' ')}
			onClick={() => onSelect(icon)}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
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

export default ChatMessageReaction;
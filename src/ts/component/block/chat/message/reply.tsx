import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, S, U } from 'Lib';

const ChatMessageReply = observer(class ChatMessageReply extends React.Component<I.ChatMessageComponent> {

	render () {
		const { space } = S.Common;
		const { id, subId, getReplyContent, onReplyClick } = this.props;
		const message = S.Chat.getReply(subId, id);
		const cn = [ 'reply' ];

		if (!message) {
			return null;
		};

		const { text, attachment, isMultiple } = getReplyContent(message);
		const author = U.Space.getParticipant(U.Space.getParticipantId(space, message.creator));
		const iconLayouts = U.Object.getFileLayouts().concat(U.Object.getHumanLayouts());

		let icon: any = null;

		if (attachment) {
			const iconSize = iconLayouts.includes(attachment.layout) ? 16 : null;

			icon = <IconObject className={iconSize ? 'noBg' : ''} object={attachment} size={16} iconSize={iconSize} />;
			cn.push('withAttachment');
		} else
		if (isMultiple) {
			icon = <Icon className="isMultiple" />;
			cn.push('withAttachment');
		};

		if (U.Common.checkRtl(text)) {
			cn.push('isRtl');
		};

		return (
			<div className={cn.join(' ')} onClick={onReplyClick}>
				<ObjectName object={author} />
				<div className="bubble">
					{icon}
					<div className="textWrapper">
						<div className="text" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
					</div>
				</div>
			</div>
		);
	};
});

export default ChatMessageReply;

import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, Label } from 'Component';
import { I, S, U } from 'Lib';

import Message from './message';

interface Props extends I.BlockComponent {
	chatId: string;
	block: I.Block;
	subId: string;
	firstUnreadOrderId: string;
	list: I.ChatMessage[];
	createdAt: number;
	setRef: (ref: any, id: string) => void;
	scrollToBottom: () => void;
	onContextMenu: (e: React.MouseEvent, item: I.ChatMessage, isMore?: boolean) => void;
	onReplyEdit: (e: React.MouseEvent, item: I.ChatMessage) => void;
	onReplyClick: (e: React.MouseEvent, item: I.ChatMessage) => void;
	getReplyContent: (item: I.ChatMessage) => { title: string; text: string; attachment: any; isMultiple: boolean; };
	getMessageMenuOptions: (item: I.ChatMessage, noControls: boolean) => I.Option[];
};

const ChatSection = observer(forwardRef<{}, Props>((props, ref) => {

	const { showRelativeDates, dateFormat } = S.Common;
	const { 
		createdAt, list, chatId, block, subId, firstUnreadOrderId, getMessageMenuOptions, setRef, scrollToBottom, onContextMenu, onReplyEdit, 
		onReplyClick, getReplyContent,
	} = props;
	const day = showRelativeDates ? U.Date.dayString(createdAt) : null;
	const date = day ? day : U.Date.dateWithFormat(dateFormat, createdAt);

	return (
		<div className="section">
			<div className="date">
				<Label text={date} />
			</div>

			{(list || []).map(item => (
				<Message
					ref={ref => setRef(ref, item.id)}
					key={item.id}
					{...props}
					id={item.id}
					rootId={chatId}
					blockId={block.id}
					subId={subId}
					isNew={item.orderId == firstUnreadOrderId}
					hasMore={!!getMessageMenuOptions(item, true).length}
					scrollToBottom={scrollToBottom}
					onContextMenu={e => onContextMenu(e, item)}
					onMore={e => onContextMenu(e, item, true)}
					onReplyEdit={e => onReplyEdit(e, item)}
					onReplyClick={e => onReplyClick(e, item)}
					getReplyContent={getReplyContent}
				/>
			))}
		</div>
	);

}));

export default ChatSection;
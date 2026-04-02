import React, { forwardRef } from 'react';
import { Icon, Label, Title } from 'Component';
import { translate } from 'Lib';

const ChatEmpty = forwardRef<{}, {}>(() => {

	return (
		<div className="chatEmptyState">
			<div className="inner">
				<Title text={translate('blockChatEmptyTitle')} />
				<div className="item">
					<Icon name="chat/empty/infinity" />
					<Label text={translate('blockChatEmptyItem1')} />
				</div>
				<div className="item">
					<Icon name="chat/empty/wifi" />
					<Label text={translate('blockChatEmptyItem2')} />
				</div>
				<div className="item">
					<Icon name="chat/empty/key" />
					<Label text={translate('blockChatEmptyItem3')} />
				</div>
			</div>
		</div>
	);

});

export default ChatEmpty;
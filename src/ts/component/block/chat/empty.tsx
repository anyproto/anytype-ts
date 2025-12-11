import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label, Title, Button } from 'Component';
import { U, translate, analytics, Action } from 'Lib';

const ChatEmpty = observer(forwardRef<{}, {}>(() => {

	const spaceview = U.Space.getSpaceview();
	
	return (
		<div className="chatEmptyState">
			<div className="inner">
				<Title text={translate('blockChatEmptyTitle')} />
				<div className="item">
					<Icon className="infinity" />
					<Label text={translate('blockChatEmptyItem1')} />
				</div>
				<div className="item">
					<Icon className="wifi" />
					<Label text={translate('blockChatEmptyItem2')} />
				</div>
				<div className="item">
					<Icon className="key" />
					<Label text={translate('blockChatEmptyItem3')} />
				</div>
				{spaceview.isChat ? (
					<div className="buttons">
						<Button 
							onClick={() => Action.openSpaceShare(analytics.route.chat)} 
							text={translate('blockChatEmptyShareInviteLink')} 
							className="c28" 
							color="blank" 
						/>
					</div>
				) : ''}
			</div>
		</div>
	);

}));

export default ChatEmpty;
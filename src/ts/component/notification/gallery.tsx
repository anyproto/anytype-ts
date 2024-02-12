import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, translate } from 'Lib';
import { commonStore } from 'Store';

const NotificationGallery = observer(class NotificationGallery extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item, onButton } = this.props;
		const { payload, title, text } = item;
		const { errorCode, spaceId } = payload;

		let buttons = [];
		if (!errorCode && (spaceId != commonStore.space)) {
			buttons = buttons.concat([
				{ id: 'space', text: translate('notificationButtonSpace') }
			]);
		};

		return (
			<React.Fragment>
				<Title text={title} />
				<Label text={text} />

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} color="blank" className="c28" {...item} onClick={e => onButton(e, item.id)} />
					))}
				</div>
			</React.Fragment>
		);
	};
	
});

export default NotificationGallery;
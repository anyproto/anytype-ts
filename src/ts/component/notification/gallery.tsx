import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { commonStore } from 'Store';

const NotificationGallery = observer(class NotificationGallery extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item, onButton } = this.props;
		const { payload } = item;
		const { errorCode, spaceId, name } = payload;
		const lang = errorCode ? 'error' : 'success';
		const space = UtilObject.getSpaceviewBySpaceId(spaceId);

		let title = translate(UtilCommon.toCamelCase(`notification-gallery-${lang}-title`));
		let text = translate(UtilCommon.toCamelCase(`notification-gallery-${lang}-text`));
		let buttons = [];

		if (errorCode) {
			text = UtilCommon.sprintf(text, name);

			buttons = buttons.concat([
				{ id: 'importRetry', text: 'Retry' },
				{ id: 'importReport', text: 'Report' },
			]);
		} else {
			title = UtilCommon.sprintf(title, name);
			text = UtilCommon.sprintf(text, space.name);
		};

		if (!errorCode && (spaceId != commonStore.space)) {
			buttons = buttons.concat([
				{ id: 'space', text: 'Go to space' }
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
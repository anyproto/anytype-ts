import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { commonStore } from 'Store';

const NotificationImport = observer(class NotificationImport extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item, onButton } = this.props;
		const { payload, type } = item;
		const { errorCode, spaceId, importType } = payload;
		const object = UtilObject.getSpaceviewBySpaceId(spaceId) || {};
		const lang = errorCode ? 'error' : 'success';

		let title = translate(UtilCommon.toCamelCase(`notification-${type}-${lang}-title`));
		let text = translate(UtilCommon.toCamelCase(`notification-${type}-${lang}-text`));

		if (importType == 0 && errorCode == 5) {
			title = translate('notificationNotionErrorNoObjectsTitle');
			text = translate('notificationNotionErrorNoObjectsText');
		};

		let buttons = [];
		if (!errorCode && (spaceId != commonStore.space)) {
			buttons = buttons.concat([
				{ id: 'space', text: 'Go to space' }
			]);
		};

		return (
			<React.Fragment>
				<Title text={UtilCommon.sprintf(title, object.name)} />
				<Label text={UtilCommon.sprintf(text, object.name)} />

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} color="blank" className="c28" {...item} onClick={e => onButton(e, item.id)} />
					))}
				</div>
			</React.Fragment>
		);
	};
	
});

export default NotificationImport;

import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';

const NotificationImport = observer(class NotificationImport extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item, onButton } = this.props;
		const { payload, type } = item;
		const { errorCode } = payload;

		let title = '';
		let text = '';
		let buttons = [];

		if (errorCode) {
			title = translate(UtilCommon.toCamelCase(`notification-${type}-error-title`));
			text = translate(UtilCommon.toCamelCase(`notification-${type}-error-text`));
		} else {
			title = translate(UtilCommon.toCamelCase(`notification-${type}-success-title`));
			text = translate(UtilCommon.toCamelCase(`notification-${type}-success-text`));
		};

		return (
			<React.Fragment>
				<Title text={title} />
				<Label text={title} />

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
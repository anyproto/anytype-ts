import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, translate } from 'Lib';

const NotificationUsecase = observer(class NotificationUsecase extends React.Component<I.Notification, {}> {

	render () {
		const { type, status, object } = this.props;

		let title = '';
		let text = '';
		let buttons = [];

		if (status) {
			title = translate(`notification${type}SuccessTitle`);
			text = translate(`notification${type}SuccessText`);

			buttons = buttons.concat([
				{ text: 'Go to space' }
			]);
		} else {
			title = translate(`notification${type}ErrorTitle`);
			text = translate(`notification${type}ErrorText`);

			buttons = buttons.concat([
				{ text: 'Retry' },
				{ text: 'Report' },
			]);
		};

		return (
			<React.Fragment>
				<Title text={UtilCommon.sprintf(title, object.name)} />
				<Label text={UtilCommon.sprintf(text, object.name)} />

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} color="blank" className="c28" {...item} />
					))}
				</div>
			</React.Fragment>
		);
	};
	
});

export default NotificationUsecase;
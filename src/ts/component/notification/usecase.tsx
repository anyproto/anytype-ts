import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, translate } from 'Lib';

const NotificationUsecase = observer(class NotificationUsecase extends React.Component<I.NotificationComponent, {}> {

	render () {
		/*
		const { item, onButton } = this.props;
		const { type, status, object } = item;

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
				{ id: 'usecaseRetry', text: 'Retry' },
				{ id: 'usecaseReport', text: 'Report' },
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
		*/
		return <div />;
	};
	
});

export default NotificationUsecase;
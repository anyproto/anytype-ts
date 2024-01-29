import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { commonStore } from 'Store';

const NotificationJoin = observer(class NotificationJoin extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item, onButton } = this.props;
		const { text } = item;
		const buttons = [
			{ id: 'request', text: translate('notificationButtonRequest') }
		];

		return (
			<React.Fragment>
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

export default NotificationJoin;

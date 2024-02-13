import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label } from 'Component';
import { I } from 'Lib';

const NotificationImport = observer(class NotificationImport extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item } = this.props;
		const { title, text } = item;

		return (
			<React.Fragment>
				<Title text={title} />
				<Label text={text} />
			</React.Fragment>
		);
	};
	
});

export default NotificationImport;
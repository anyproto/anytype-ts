import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label } from 'Component';
import { I, UtilCommon, translate } from 'Lib';

const NotificationImport = observer(class NotificationImport extends React.Component<I.NotificationComponent, {}> {

	render () {
		const { item } = this.props;
		const { payload, type } = item;
		const { errorCode } = payload;
		const lang = errorCode ? 'error' : 'success';
		const title = translate(UtilCommon.toCamelCase(`notification-${type}-${lang}-title`));
		const text = translate(UtilCommon.toCamelCase(`notification-${type}-${lang}-text`));

		return (
			<React.Fragment>
				<Title text={title} />
				<Label text={text} />
			</React.Fragment>
		);
	};
	
});

export default NotificationImport;
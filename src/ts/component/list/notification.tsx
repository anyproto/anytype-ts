import * as React from 'react';
import { Notification } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface Props {
	dataset?: I.Dataset;
	history: any;
};

const ListNotification = observer(class ListNotification extends React.Component<Props> {

	render () {
		const { list } = notificationStore;
		return (
			<div className="notifications">
				{list.map((item: I.Notification, i: number) => (
					<Notification {...this.props} key={item.id} {...item} />
				))}
			</div>
		);
	};
	
});

export default ListNotification;
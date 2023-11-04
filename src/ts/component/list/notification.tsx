import * as React from 'react';
import { Notification } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface Props {
	dataset?: I.Dataset;
	history: any;
};

const LIMIT = 10;
const WIDTH = 360;

const ListNotification = observer(class ListNotification extends React.Component<Props> {

	isExpanded = false;

	render () {
		const { list } = notificationStore;



		return (
			<div id="notifications" className="notifications">
				{list.slice(0, LIMIT).map((item: I.Notification, i: number) => {
					const scale = 1 - (i / 20);
					const style: any = {};

					if (!this.isExpanded) {
						style.transform = `scale3d(${scale}, ${scale}, 1) translate3d(0px, -${8 * i}px, 0px)`;
						style.zIndex = LIMIT - i;
					};

					return <Notification {...this.props} key={item.id} {...item} style={style} />
				})}
			</div>
		);
	};
	
});

export default ListNotification;
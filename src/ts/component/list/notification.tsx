import * as React from 'react';
import { Notification } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface State {
	isExpanded: boolean;
};

const ListNotification = observer(class ListNotification extends React.Component<object, State> {

	state = {
		isExpanded: false,
	};

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { isExpanded } = this.state;
		const { list } = notificationStore;
		const cn = [ 'notifications' ];
		const limit = isExpanded ? 5 : 10;

		if (isExpanded) {
			cn.push('isExpanded');
		};

		return (
			<div 
				id="notifications" 
				className={cn.join(' ')}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				{list.slice(0, limit).map((item: I.Notification, i: number) => {
					const scale = 1 - (i / 20);
					const style: any = {};

					if (!isExpanded) {
						style.transform = `scale3d(${scale}, ${scale}, 1) translate3d(0px, -${8 * i}px, 0px)`;
						style.zIndex = limit - i;
					};

					return <Notification {...this.props} key={item.id} {...item} style={style} />
				})}
			</div>
		);
	};

	onMouseEnter () {
		this.setState({ isExpanded: true });
	};

	onMouseLeave () {
		this.setState({ isExpanded: false });
	};
	
});

export default ListNotification;
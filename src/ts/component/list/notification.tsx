import * as React from 'react';
import $ from 'jquery';
import { Notification } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const LIMIT = 5;

const ListNotification = observer(class ListNotification extends React.Component {

	node = null;
	isExpanded = false;

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { list } = notificationStore;
		const cn = [ 'notifications' ];

		return (
			<div 
				id="notifications" 
				ref={node => this.node = node}
				className={cn.join(' ')}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				{list.slice(0, LIMIT).map((item: I.Notification, i: number) => (
					<Notification {...this.props} key={item.id} {...item} style={{ zIndex: LIMIT - i }} />
				))}
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	onMouseEnter () {
		this.isExpanded = true;
		this.resize();
	};

	onMouseLeave () {
		this.isExpanded = false;
		this.resize();
	};

	resize () {
		const node = $(this.node);
		const items = node.find('.notification');

		let nh = 0;
		let fh = 0;
		let height = 0;
		let bottom = 0;

		items.each((i: number, item: any) => {
			item = $(item);

			const h = item.outerHeight();
			if (i == 0) {
				fh = h;
			};

			if (!this.isExpanded) {
				bottom = 4 * i;
				if (height > h) {
					bottom += height - h;
				};
				nh = fh + 4 * i;
			} else {
				const o = i > 0 ? 8 : 0;

				bottom += height + o;
				nh += h + o;
			};

			item.css({ bottom });
			height = h;
		});

		node.css({ height: nh });
	};
	
});

export default ListNotification;
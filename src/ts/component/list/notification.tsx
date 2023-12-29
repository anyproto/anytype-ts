import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Notification, Icon } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I, C } from 'Lib';

const LIMIT = 5;

const ListNotification = observer(class ListNotification extends React.Component {

	node = null;
	isExpanded = false;

	constructor (props: any) {
		super(props);

		this.onShow = this.onShow.bind(this);
		this.onHide = this.onHide.bind(this);
		this.onClear = this.onClear.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		const { list } = notificationStore;

		return (
			<div 
				id="notifications" 
				ref={node => this.node = node}
				className="notifications"
				onClick={this.onShow}
			>
				{list.length ? (
					<div className="head">
						<Icon className="hide" onClick={this.onHide} />
						<Icon className="clear" onClick={this.onClear} />
					</div>
				) : ''}

				<div className="body">
					{list.slice(0, LIMIT).map((item: I.Notification, i: number) => (
						<Notification 
							{...this.props}
							item={item}
							key={item.id} 
							style={{ zIndex: LIMIT - i }}
							resize={this.resize}
						/>
					))}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	onShow (e: any) {
		e.stopPropagation();

		if (this.isExpanded) {
			return;
		};

		$(this.node).addClass('isExpanded');

		this.isExpanded = true;
		this.resize();
	};

	onHide (e: any) {
		e.stopPropagation();

		if (!this.isExpanded) {
			return;
		};

		$(this.node).removeClass('isExpanded');

		this.isExpanded = false;
		this.resize();
	};

	onClear () {
		C.NotificationReply(notificationStore.list.map(it => it.id), I.NotificationAction.Close);
		notificationStore.clear();
	};

	resize () {
		const node = $(this.node);
		const items = node.find('.notification');

		let nh = 0;
		let fh = 0;
		let height = 0;
		let bottom = 0;

		raf(() => {
			items.each((i: number, item: any) => {
				item = $(item);
				item.css({ 
					width: (this.isExpanded ? '100%' : `calc(100% - ${4 * i * 2}px)`),
					right: (this.isExpanded ? 0 : 4 * i),
				});
				
				const h = item.outerHeight();

				if (i == 0) {
					fh = h;
				};

				if (!this.isExpanded) {
					if (i > 0) {
						bottom = fh + 4 * i - h;
					};
				} else {
					const o = i > 0 ? 8 : 0;

					bottom += height + o;
					nh += h + o;
				};

				item.css({ bottom });
				height = h;
			});

			if (!this.isExpanded) {
				nh = fh + 4 * (LIMIT - 1);
			} else 
			if (items.length) {
				nh += 38;
			};

			node.css({ height: nh });
		});
	};
	
});

export default ListNotification;
import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { Notification } from 'Component';
import { notificationStore } from 'Store';
import { observer } from 'mobx-react';
import { I, UtilSmile, UtilCommon } from 'Lib';

const LIMIT = 5;

const ListNotification = observer(class ListNotification extends React.Component {

	node = null;
	isExpanded = false;
	timeout = 0;

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { list } = notificationStore;

		return (
			<div 
				id="notifications" 
				ref={node => this.node = node}
				className="notifications"
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
		for (let i = 0; i < 10; ++i) {
			const icon1 = UtilSmile.randomParam();
			const icon2 = UtilSmile.randomParam();

			const object = { 
				name: 'Strategic writing', 
				iconEmoji: `:${icon1.id}:`, 
				layout: I.ObjectLayout.Page,
			};

			const subject = { 
				name: 'Investors space', 
				iconEmoji: `:${icon2.id}:`, 
				layout: I.ObjectLayout.Page,
			};

			notificationStore.add({ 
				id: String(i), 
				type: UtilCommon.rand(0, 1), 
				status: Boolean(UtilCommon.rand(0, 1)), 
				object,
				subject,
			});
		};

		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeout);
	};

	onMouseEnter () {
		const node = $(this.node);

		node.addClass('isExpanded');

		this.isExpanded = true;
		this.resize();

		window.clearTimeout(this.timeout);
	};

	onMouseLeave () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const node = $(this.node);

			node.removeClass('isExpanded');

			this.isExpanded = false;
			this.resize();
		}, 500);
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

				const h = item.outerHeight();
				const css: any = { right: 12, width: '100%' };
				
				if (i == 0) {
					fh = h;
				};

				if (!this.isExpanded) {
					if (i > 0) {
						bottom = fh + 4 * i - h;
						css.width = `calc(100% - ${4 * i * 2}px)`
						css.right += 4 * i;
					};
				} else {
					const o = i > 0 ? 8 : 0;

					bottom += height + o;
					nh += h + o;
				};

				item.css({ ...css, bottom });
				height = h;
			});

			if (!this.isExpanded) {
				nh = fh + 4 * (LIMIT - 1);
			};

			node.css({ height: nh + 50 });
		});
	};
	
});

export default ListNotification;
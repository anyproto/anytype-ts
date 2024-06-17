import * as React from 'react';
import $ from 'jquery';
import { Icon, IconObject } from 'Component';
import { authStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
import { I, UtilData, translate, UtilDate } from 'Lib';
const Constant = require('json/constant.json');

const MENU_ID = 'threadStatus';

const MenuThreadList = observer(class MenuThreadList extends React.Component<I.Menu> {

	node: any = null;
	timeoutMenu = 0;
	timeoutClose = 0;

	constructor (props: I.Menu) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { account } = authStore;
		const { info } = account;
		const thread = authStore.threadGet(rootId);
		const accounts = thread.accounts || [];
		const status = UtilData.getThreadStatus(rootId, 'cafe');
		const networkName = UtilData.getNetworkName();

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={() => this.onMouseEnter(item.id, false)}
			>
				<IconObject object={{ ...item, layout: I.ObjectLayout.Human }} />
				<div className="info">
					<div className="name">{item.name}</div>
					<div className="description">
						<div className="side left">{translate('menuThreadListLastSync')}</div>
						<div className="side right">
							{UtilDate.timeAgo(Math.max(item.lastPulled, item.lastEdited))}
						</div>
					</div>
				</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="items"
			>
				<div 
					id="item-cafe" 
					className="item" 
					onMouseOver={() => this.onMouseEnter('cafe', true)}
				>
					<Icon className="cafe" />
					<div className="info">
						<div className="name">{networkName}</div>
						{info.networkId ? (
							<div className={[ 'description', UtilData.threadColor(status) ].join(' ')}>
								{translate(`threadStatus${status}`)}
							</div>
						) : ''}
					</div>
				</div>
				{(accounts || []).map((item: I.ThreadAccount, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		const { getId } = this.props;
		const { account } = authStore;
		const { info } = account;

		if (!info.networkId) {
			return;
		};

		const obj = $(`#${getId()}`);

		const clear = () => {
			window.clearTimeout(this.timeoutClose);
			window.clearTimeout(this.timeoutMenu);
		};

		const leave = () => {
			clear();
			this.timeoutClose = window.setTimeout(() => {
				clear();
				menuStore.close(this.props.id);
				menuStore.close('threadStatus');
			}, 1000);
		};

		obj.off('mouseenter').on('mouseenter', () => clear());
		obj.off('mouseleave').on('mouseleave', () => {
			const status = $('#menuThreadStatus');

			if (status.length) {
				status.off('mouseenter').on('mouseenter', () => clear());
				status.off('mouseleave').on('mouseleave', () => leave());
			};

			leave();
		});
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeoutClose);
		window.clearTimeout(this.timeoutMenu);

		menuStore.close(MENU_ID);
	};

	onMouseEnter (id: string, isCafe: boolean) {
		if (!id) {
			return;
		};

		const { account } = authStore;
		const { info } = account;

		if (!info.networkId) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;
		const node = $(this.node);
		const item = node.find(`#item-${id}`);

		if (!item.length) {
			return;
		};

		const top = item.offset().top - $(window).scrollTop();
		const cnw = [ 'fixed' ];
		
		if (classNameWrap) {
			cnw.push(classNameWrap);
		};

		if (!menuStore.isOpen(MENU_ID, id)) {
			menuStore.close(MENU_ID, () => {
				menuStore.open(MENU_ID, {
					menuKey: id,
					element: `#${getId()} #item-${id}`,
					offsetX: getSize().width,
					fixedY: top,
					classNameWrap: cnw.join(' '),
					noDimmer: true,
					data: {
						...data,
						accountId: id,
						isCafe,
					},
				});
			});
		};
	};
	
});

export default MenuThreadList;
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, IconObject } from 'ts/component';
import { authStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil, translate, Util } from 'ts/lib';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class MenuThreadList extends React.Component<Props, {}> {

	timeoutMenu: number = 0;
	timeoutClose: number = 0;

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const thread = authStore.threadGet(rootId);
		const { accounts, cafe } = thread;
		const { status } = cafe || {};

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onMouseEnter(item.id, false); }}
			>
				<IconObject object={{ ...item, type: '/profile' }} />
				<div className="info">
					<div className="name">{item.name}</div>
					<div className="description">
						<div className="side left">Last sync</div>
						<div className="side right">
							{Util.timeAgo(Math.max(item.lastPulled, item.lastEdited))}
						</div>
					</div>
				</div>
			</div>
		);

		return (
			<div className="items">
				<div 
					id="item-cafe" 
					className="item" 
					onMouseOver={(e: any) => { this.onMouseEnter('cafe', true); }} 
				>
					<Icon className="cafe" />
					<div className="info">
						<div className="name">Backup node</div>
						<div className={[ 'description', DataUtil.threadColor(status) ].join(' ')}>
							{translate('syncStatus' + status)}
						</div>
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
		const obj = $('#' + getId());
		
		const clear = () => {
			window.clearTimeout(this.timeoutClose);
			window.clearTimeout(this.timeoutMenu);
		};

		const leave = () => {
			clear();
			this.timeoutClose = window.setTimeout(() => {
				clear();
				commonStore.menuClose(this.props.id);
				commonStore.menuClose('threadStatus');
			}, 1000);
		};

		obj.unbind('mouseenter').on('mouseenter', () => { clear(); });

		obj.unbind('mouseleave').on('mouseleave', () => {
			const status = $('#menuThreadStatus');
			if (status.length) {
				status.unbind('mouseenter').on('mouseenter', () => { 
					clear();
				});
				status.unbind('mouseleave').on('mouseleave', leave);
			};
			leave();
		});
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeoutClose);
		window.clearTimeout(this.timeoutMenu);
	};

	onMouseEnter (id: string, isCafe: boolean) {
		if (!id) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { menus } = commonStore;
		const menu = menus.find((it: I.Menu) => { return it.id == 'threadStatus'; });

		if (menu && (menu.param.data.accountId == id)) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const item = node.find('#item-' + id);
		if (!item.length) {
			return;
		};

		const top = item.offset().top - $(window).scrollTop();

		window.clearTimeout(this.timeoutMenu);
		this.timeoutMenu = window.setTimeout(() => {
			commonStore.menuOpen('threadStatus', {
				element: '#item-' + id,
				type: I.MenuType.Vertical,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				offsetX: 272,
				offsetY: 0,
				fixedY: top,
				className: 'fixed',
				noDimmer: true,
				data: {
					...data,
					accountId: id,
					isCafe: isCafe,
				},
			});
		}, Constant.delay.menu);
	};
	
};

export default MenuThreadList;
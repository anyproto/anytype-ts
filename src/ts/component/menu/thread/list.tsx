import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { authStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil, translate, Util } from 'ts/lib';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuThreadList extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const thread = authStore.threadGet(rootId);
		const { accounts, cafe } = thread;
		const { status } = cafe;

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onMouseEnter(item.id, false); }}
				onMouseLeave={this.onMouseLeave}
			>
				<IconUser className="c40" {...item} avatar={item.imageHash} />
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
					onMouseLeave={(e: any) => { commonStore.menuClose('threadStatus'); }}
				>
					<Icon className="cafe" />
					<div className="info">
						<div className="name">Backup node</div>
						<div className={[ 'description', DataUtil.threadColor(status) ].join(' ')}>
							{translate('syncStatus' + status)}
						</div>
					</div>
				</div>
				{accounts.map((item: I.ThreadAccount, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidUpdate () {
		commonStore.menuClose('threadStatus');
	};

	onMouseEnter (id: string, isCafe: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { menus } = commonStore;
		const menu = menus.find((it: I.Menu) => { return it.id == 'threadStatus'; });

		if (menu && (menu.param.data.accountId == id)) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			commonStore.menuOpen('threadStatus', {
				element: '#item-' + id,
				type: I.MenuType.Vertical,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				offsetX: 272,
				offsetY: -62,
				data: {
					...data,
					accountId: id,
					isCafe: isCafe,
				},
			});
		}, Constant.delay.menu);
	};
	
	onMouseLeave (e: any) {
		commonStore.menuClose('threadStatus');
	};

};

export default MenuThreadList;
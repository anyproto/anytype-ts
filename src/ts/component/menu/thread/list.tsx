import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { authStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil, translate, Util } from 'ts/lib';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuThreadList extends React.Component<Props, {}> {
	
	render () {
		const { threadAccounts, threadCafe } = authStore;
		const { status } = threadCafe;

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseOver={(e: any) => { this.onMenu(item.id, false); }}
				onMouseLeave={(e: any) => { commonStore.menuClose('threadStatus'); }}
			>
				<IconUser className="c40" {...item} />
				<div className="info">
					<div className="name">{item.id}</div>
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
					onMouseOver={(e: any) => { this.onMenu('cafe', true); }} 
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
				{threadAccounts.map((item: I.Account, i: number) => (
					<Item key={i} {...item} />
				))}
			</div>
		);
	};

	componentDidUpdate () {
		commonStore.menuClose('threadStatus');
	};

	onMenu (id: string, isCafe: boolean) {
		commonStore.menuOpen('threadStatus', {
			element: '#item-' + id,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetX: 272,
			offsetY: -62,
			data: {
				accountId: id,
				isCafe: isCafe,
			},
		});
	};
	
};

export default MenuThreadList;
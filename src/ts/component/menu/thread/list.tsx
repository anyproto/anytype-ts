import * as React from 'react';
import { Icon, IconUser } from 'ts/component';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, DataUtil, translate, Util } from 'ts/lib';

interface Props extends I.Menu {};

@observer
class MenuThreadList extends React.Component<Props, {}> {
	
	render () {
		const { threadAccounts, threadCafe } = authStore;
		const { status } = threadCafe;

		const Item = (item: any) => (
			<div className="item">
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
				<div className="item">
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
	
};

export default MenuThreadList;
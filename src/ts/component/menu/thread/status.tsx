import * as React from 'react';
import { authStore } from 'ts/store';
import { I, Util } from 'ts/lib';

interface Props extends I.Menu {};

class MenuThreadStatus extends React.Component<Props, {}> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, isCafe, accountId } = data;
		const thread = authStore.threadGet(rootId);
		const { cafe, accounts } = thread;
		const account = accounts.find((it: I.ThreadAccount) => { return it.id == accountId; });
		
		const Item = (item: any) => (
			<div className="item">
				<div className="name">{item.name}</div>
				{item.fields.map((field: any, i: number) => (
					<div key={i} className="description">
						<div className="side left">{field.key}</div>
						<div className={[ 'side', 'right', field.color ].join(' ')}>{field.value}</div>
					</div>
				))}
			</div>
		);

		const cafeFields = [ 
			{ key: 'Data is backed up', value: (cafe.status ? 'Success' : 'Failure'), color: (cafe.status ? 'green' : 'red') },
			{ key: 'All edits sync', value: Util.timeAgo(cafe.lastPulled), color: '' }
		];

		return isCafe ? (
			<div className="items">	
				<Item name="Status" fields={cafeFields} />
			</div>
		) : (
			<React.Fragment>
				<div className="section">
					<div className="name">My devices</div>
					<div className="items">	
						{account.devices.map((item: any, i: number) => {
							const fields = [
								{ key: 'Last sync',  value: Util.timeAgo(item.lastPulled), color: '' },
								{ key: 'Last edit',  value: Util.timeAgo(item.lastEdited), color: '' }
							];
							return <Item key={i} {...item} fields={fields} />;
						})}
					</div>
				</div>
			</React.Fragment>
		);
	};
	
};

export default MenuThreadStatus;
import * as React from 'react';
import { authStore } from 'ts/store';
import { I, Util } from 'ts/lib';

interface Props extends I.Menu {};

class MenuThreadStatus extends React.Component<Props, {}> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { isCafe, accountId } = data;
		const { threadAccounts, threadCafe } = authStore;
		const account = threadAccounts.find((it: I.ThreadAccount) => { return it.id == accountId; });
		
		const Item = (item: any) => (
			<div className="item">
				<div className="name">{item.name}</div>
				{item.fields.map((field: any, i: number) => (
					<div key={i} className="description">
						<div className="side left">{field.key}</div>
						<div className="side right">{field.value}</div>
					</div>
				))}
			</div>
		);

		const cafeFields = [ 
			{ key: 'Data is backed up', value: (threadCafe.status ? 'Success' : 'Failure') },
			{ key: 'All edits sync', value: Util.timeAgo(threadCafe.lastPulled) }
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
								{ key: 'Last sync',  value: Util.timeAgo(item.lastPulled) },
								{ key: 'Last edit',  value: Util.timeAgo(item.lastEdited) }
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
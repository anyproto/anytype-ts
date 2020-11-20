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
						<div className="side right">{field.value}</div>
					</div>
				))}
			</div>
		);

		var cafeFields

		cafe.lastPushSucceed ? (
			cafeFields = [
				{ key: 'All changes are backed up on server'},
				{ key: 'Data recieved', value: Util.timeAgo(cafe.lastPulled) }
		]) : (
			cafeFields = [
				{ key: 'Data recieved', value: Util.timeAgo(cafe.lastPulled) }
		]);

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
								{ key: 'Changes sent',  value: Util.timeAgo(item.lastEdited) },
								{ key: 'Data recieved',  value: Util.timeAgo(item.lastPulled) }
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

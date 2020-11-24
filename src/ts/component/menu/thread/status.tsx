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
		const { status } = cafe;
		const account = accounts.find((it: I.ThreadAccount) => { return it.id == accountId; });

		const Item = (item: any) => (
			<div className="item">
				<div className="name">{item.name}</div>
				{item.fields.map((field: any, i: number) => (
					<div key={i} className="description">
						{field.value ? (
							<React.Fragment>
								<div className="side left">{field.key}</div>
								<div className="side right">{field.value}</div>
							</React.Fragment>
						) : field.key}
					</div>
				))}
			</div>
		);

		let cafeFields = [];
		if (cafe.lastPushSucceed) {
			cafeFields = [
				{ key: 'Object is backed up on the server'},
				{ key: 'Changes requested', value: Util.timeAgo(cafe.lastPulled) }
			];
		} else {
			cafeFields = [
				{ key: 'Some local changes are not backed up'},
				{ key: 'Changes requested', value: Util.timeAgo(cafe.lastPulled) }
			];
		};

		return isCafe ? (
			<div className="items">
				<Item name="Status" fields={cafeFields} />
			</div>
		) : (
			<React.Fragment>
				<div className="section">
					<div className="name">My other devices</div>
					<div className="items">
						{account.devices.map((item: any, i: number) => {
							let fields = [];
							if (status == I.ThreadStatus.Synced) {
								fields.push({ key: 'Edits were made',  value: Util.timeAgo(item.lastEdited) });
							} else {
								fields = fields.concat([
									{ key: item.online ? 'Online' : 'Offline' },
									{ key: 'Edits were made',  value: Util.timeAgo(item.lastEdited) },
									{ key: 'Changes requested',  value: item.lastPulled ? Util.timeAgo(item.lastPulled) : 'No direct interaction' }
								]);
							};
							return <Item key={i} {...item} fields={fields} />;
						})}
					</div>
				</div>
			</React.Fragment>
		);
	};

};

export default MenuThreadStatus;

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
		const { status, files } = cafe;
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

		let cafeStatus = [];
		if (cafe.lastPushSucceed) {
			cafeStatus = [
				{ key: 'This object is backed up'},
				cafe.lastPulled ? { key: 'Updates requested', value: Util.timeAgo(cafe.lastPulled) } : {},
			];
		} else {
			cafeStatus = [
				{ key: 'Some changes are not backed up'},
				cafe.lastPulled ? { key: 'Updates requested', value: Util.timeAgo(cafe.lastPulled) } : {},
			];
		};

		const fileStatus = [
			{ key: 'Uploading', value: files.pinning + files.failed },
			{ key: 'Waiting for upload', value: files.failed },
			{ key: 'Stored', value: files.pinned },
			{ key: 'Updates requested', value: Util.timeAgo(files.updated) }
		];

		return isCafe ? (
			<div className="items">
				<Item name="Status" fields={cafeStatus} />
				<Item name="Files" fields={fileStatus} />
			</div>
		) : (
			<React.Fragment>
				<div className="section">
					<div className="name">My devices</div>
					<div className="items">
						{account.devices.map((item: any, i: number) => {
							const fields = [
								{ key: 'Direct connection',  value: item.online ? 'Online' : 'Offline' },
								{ key: 'Updates requested',  value: item.lastPulled ? Util.timeAgo(item.lastPulled) : 'No interaction' },
								{ key: 'Last edits recieved',  value: item.lastEdited ?  Util.timeAgo(item.lastEdited) : 'No changes' }
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

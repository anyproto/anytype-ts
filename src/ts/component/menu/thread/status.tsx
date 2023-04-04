import * as React from 'react';
import { authStore } from 'Store';
import { I, Util } from 'Lib';

class MenuThreadStatus extends React.Component<I.Menu> {

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, isCafe, accountId } = data;
		const thread = authStore.threadGet(rootId);
		const cafe = thread.cafe || {};
		const status = cafe.status || {};
		const files = cafe.files || {};
		const account = (thread.accounts || []).find(it => it.id == accountId);

		const Item = (item: any) => (
			<div className="item">
				<div className="name">{item.name}</div>
				{item.fields.map((field: any, i: number) => {
					if (!field.key) {
						return null;
					};

					return (
						<div key={i} className="description">
							{field.collapse ? field.key : (
								<React.Fragment>
									<div className="side left">{field.key}</div>
									<div className="side right">{field.value}</div>
								</React.Fragment>
							)}
						</div>
					);
				})}
			</div>
		);

		let cafeStatus = [];
		if (cafe.lastPushSucceed) {
			cafeStatus = [
				{ key: 'This object is backed up', collapse: true },
				{ key: 'Updates requested', value: cafe.lastPulled ? Util.timeAgo(cafe.lastPulled) : 'No interaction' }
			];
		} else {
			cafeStatus = [
				{ key: 'Some changes are not backed up', collapse: true },
				{ key: 'Updates requested', value: cafe.lastPulled ?  Util.timeAgo(cafe.lastPulled) : 'No interaction' }
			];
		};

		const fileStatus = [
			{ key: 'Uploading', value: files.pinning },
			{ key: 'Waiting for upload', value: files.failed },
			{ key: 'Stored', value: files.pinned },
		];

		return isCafe ? (
			<div className="items">
				<Item name="Status" fields={cafeStatus} />
				<Item name="Files" fields={fileStatus} />
			</div>
		) : (
			<React.Fragment>
				<div className="section">
					<div className="name">Direct interaction with my devices</div>
					<div className="items">
						{account.devices.map((item: any, i: number) => {
							const fields = [
								// {
								// 	key: 'Direct interation status:',
								// 	value: (item.online ? 'Online' : 'Offline'),
								// },
								{
									key: 'Updates requested',
									value: (item.lastPulled ? Util.timeAgo(item.lastPulled) : 'No interaction'),
								},
								{
									key: 'Last edits received',
									value: (item.lastEdited ? Util.timeAgo(item.lastEdited) : 'No changes'),
								},
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

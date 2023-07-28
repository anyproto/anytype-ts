import * as React from 'react';
import { authStore } from 'Store';
import { I, translate, UtilCommon } from 'Lib';

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
				{ key: translate('menuThreadStatusObjectBackedUp'), collapse: true },
				{ key: translate('menuThreadStatusUpdatesRequested'), value: cafe.lastPulled ? UtilCommon.timeAgo(cafe.lastPulled) : translate('menuThreadStatusNoInteraction') }
			];
		} else {
			cafeStatus = [
				{ key: translate('menuThreadStatusSomeChangesNotBackedUp'), collapse: true },
				{ key: translate('menuThreadStatusUpdatesRequested'), value: cafe.lastPulled ?  UtilCommon.timeAgo(cafe.lastPulled) : translate('menuThreadStatusNoInteraction') }
			];
		};

		const fileStatus = [
			{ key: translate('menuThreadStatusUploading'), value: files.pinning },
			{ key: translate('menuThreadStatusWaitingForUpload'), value: files.failed },
			{ key: translate('menuThreadStatusStored'), value: files.pinned },
		];

		return isCafe ? (
			<div className="items">
				<Item name={translate('menuThreadStatusStatus')} fields={cafeStatus} />
				<Item name={translate('menuThreadStatusFiles')} fields={fileStatus} />
			</div>
		) : (
			<React.Fragment>
				<div className="section">
					<div className="name">{translate('menuThreadStatusDirectInteractionTitle')}</div>
					<div className="items">
						{account.devices.map((item: any, i: number) => {
							const fields = [
								// {
								// 	key: translate('menuThreadStatusDirectInteractionStatus'),
								// 	value: translate(item.online ? 'menuThreadStatusOnline' : 'menuThreadStatusOffline'),
								// },
								{
									key: translate('menuThreadStatusUpdatesRequested'),
									value: (item.lastPulled ? UtilCommon.timeAgo(item.lastPulled) : translate('menuThreadStatusNoInteraction')),
								},
								{
									key: translate('menuThreadStatusLastEditsReceived'),
									value: (item.lastEdited ? UtilCommon.timeAgo(item.lastEdited) : translate('menuThreadStatusNoChanges')),
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

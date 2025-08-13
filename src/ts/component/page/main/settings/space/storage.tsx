import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, ListObjectManager, Label, Button, ProgressBar } from 'Component';
import { I, J, U, S, translate, Action, analytics } from 'Lib';

const STORAGE_FULL = 0.95;

const PageMainSettingsStorage = observer(class PageMainSettingsStorage extends React.Component<I.PageSettingsComponent, {}> {

	node = null;
	refManagers = {
		synced: null,
		notSynced: null,
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
	};

	render () {
		const { spaceStorage } = S.Common;
		const { localUsage, bytesLimit } = spaceStorage;
		const { notSyncedCounter } = S.Auth.getSyncStatus();
		const spaces = U.Space.getList();
		const usageCn = [ 'item' ];
		const canWrite = U.Space.canMyParticipantWrite();

		let bytesUsed = 0;
		let buttonUpgrade = null;
		let label = U.Common.sprintf(translate(`popupSettingsSpaceIndexStorageText`), U.File.size(bytesLimit));

		const progressSegments = (spaces || []).map(space => {
			const object: any = S.Common.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
			const usage = Number(object.bytesUsage) || 0;
			const isOwner = U.Space.isMyOwner(space.targetSpaceId);

			if (!isOwner) {
				return null;
			};

			bytesUsed += usage;
			return { name: space.name, caption: U.File.size(usage), percent: usage / bytesLimit, isActive: space.isActive };
		}).filter(it => it);
		const isRed = (bytesUsed / bytesLimit >= STORAGE_FULL) || (localUsage > bytesLimit);

		if (isRed) {
			usageCn.push('red');
			buttonUpgrade = <Button className="payment" text={translate('commonUpgrade')} onClick={this.onUpgrade} />;
			label = translate('popupSettingsSpaceIndexStorageIsFullText');
		};

		const Manager = (item: any) => {
			const { refId } = item;
			const buttons: I.ButtonComponent[] = [
				{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: () => this.onRemove(refId) }
			];
			const filters: I.Filter[] = [
				{ relationKey: 'syncStatus', condition: I.FilterCondition.In, value: item.filters },
				{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
			];
			const sorts: I.Sort[] = [
				{ type: I.SortType.Desc, relationKey: 'sizeInBytes' },
			];

			return (
				<div className="fileManagerWrapper">
					<Title className="sub" text={item.title} />

					<ListObjectManager
						ref={ref => this.refManagers[refId] = ref}
						subId={item.subId}
						rowLength={2}
						buttons={buttons}
						info={I.ObjectManagerItemInfo.FileSize}
						iconSize={18}
						sorts={sorts}
						filters={filters}
						keys={U.Subscription.syncStatusRelationKeys()}
						ignoreHidden={false}
						ignoreArchived={false}
						textEmpty={translate('popupSettingsSpaceStorageEmptyLabel')}
					/>
				</div>
			);
		};

		return (
			<div ref={ref => this.node = ref} className="wrap">
				{buttonUpgrade}

				<Title text={translate(`pageSettingsSpaceRemoteStorage`)} />
				<Label text={label} />

				<div className={usageCn.join(' ')}>
					<ProgressBar segments={progressSegments} current={U.File.size(bytesUsed)} max={U.File.size(bytesLimit)} />
				</div>

				{notSyncedCounter && canWrite ? (
					<Manager
						refId={'notSynced'}
						subId={J.Constant.subId.fileManagerNotSynced}
						title={translate('pageSettingsSpaceNotSyncedFiles')}
						filters={[ I.SyncStatusObject.Error ]}
					/>
				) : ''}

				{canWrite ? (
					<Manager
						refId={'synced'}
						subId={J.Constant.subId.fileManagerSynced}
						title={translate('pageSettingsSpaceSyncedFiles')}
						filters={[ I.SyncStatusObject.Synced ]}
					/>
				) : ''}
			</div>
		);
	};

	componentWillUnmount () {
		U.Subscription.destroyList([ J.Constant.subId.fileManagerSynced, J.Constant.subId.fileManagerNotSynced ]);
	};

	onUpgrade () {
		Action.membershipUpgrade();

		analytics.event('ClickUpgradePlanTooltip', { type: 'storage', route: analytics.route.settingsSpaceIndex });
	};

	onRemove (refId: string) {
		const ref = this.refManagers[refId];

		Action.delete(ref.getSelected(), analytics.route.settings, () => ref?.selectionClear());
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const sc = U.Common.getScrollContainer(isPopup);
		const height = sc.height() - J.Size.header - 36;

		node.css({ height });
	};

});

export default PageMainSettingsStorage;
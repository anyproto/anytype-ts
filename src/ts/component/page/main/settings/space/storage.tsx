import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, ListObjectManager, Label, Button, ProgressBar } from 'Component';
import { I, J, translate, Action, analytics, U, S } from 'Lib';

const STORAGE_FULL = 0.7;

const PageMainSettingsStorageManager = observer(class PageMainSettingsStorageManager extends React.Component<I.PageSettingsComponent, {}> {

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
		const { error } = S.Auth.getSyncStatus();
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
				{ relationKey: 'fileSyncStatus', condition: I.FilterCondition.In, value: item.filters },
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
						keys={U.Subscription.syncStatusRelationKeys()}
						filters={filters}
						ignoreHidden={false}
						ignoreArchived={false}
						textEmpty={translate('popupSettingsSpaceStorageManagerEmptyLabel')}
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

				{error == I.SyncStatusError.StorageLimitExceed && canWrite ? (
					<Manager
						refId={'notSynced'}
						subId={J.Constant.subId.fileManager.notSynced}
						title={translate('pageSettingsSpaceNotSyncedFiles')}
						filters={[ I.FileSyncStatus.NotSynced ]}
					/>
				) : ''}

				{canWrite ? (
					<Manager
						refId={'synced'}
						subId={J.Constant.subId.fileManager.synced}
						title={translate('pageSettingsSpaceSyncedFiles')}
						filters={[ I.FileSyncStatus.Synced ]}
					/>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		analytics.event('ScreenSettingsSpaceStorageManager');
	};

	componentWillUnmount () {
		U.Subscription.destroyList([ J.Constant.subId.fileManager.synced, J.Constant.subId.fileManager.notSynced ]);
	};

	onUpgrade () {
		const { membership } = S.Auth;

		if (membership.tier >= I.TierType.CoCreator) {
			Action.membershipUpgrade();
		} else {
			this.props.onPage('membership');
		};

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

export default PageMainSettingsStorageManager;

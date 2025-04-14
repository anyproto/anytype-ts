import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, ListObjectManager, Label, Button, ProgressBar } from 'Component';
import { I, J, translate, Action, analytics, U, S } from 'Lib';

const STORAGE_FULL = 0.7;

const PageMainSettingsStorageManager = observer(class PageMainSettingsStorageManager extends React.Component<I.PageSettingsComponent, {}> {

	node = null;
	refManager = null;

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
	};

	render () {
		const { spaceStorage } = S.Common;
		const { localUsage, bytesLimit } = spaceStorage;
		const spaces = U.Space.getList();
		const usageCn = [ 'item' ];
		const canWrite = U.Space.canMyParticipantWrite();

		let bytesUsed = 0;
		let buttonUpgrade = null;

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
			buttonUpgrade = <Button className="payment" text={translate('popupSettingsSpaceIndexRemoteStorageUpgrade')} onClick={this.onUpgrade} />;
		};

		const buttons: I.ButtonComponent[] = [
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: this.onRemove }
		];
		const filters: I.Filter[] = [
			{ relationKey: 'fileSyncStatus', condition: I.FilterCondition.Equal, value: I.FileSyncStatus.Synced },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'sizeInBytes' },
		];

		return (
			<div ref={ref => this.node = ref} className="wrap">
				{buttonUpgrade}

				<Title text={translate(`pageSettingsSpaceRemoteStorage`)} />
				<Label text={U.Common.sprintf(translate(`popupSettingsSpaceIndexStorageText`), U.File.size(bytesLimit))} />

				<div className={usageCn.join(' ')}>
					<ProgressBar segments={progressSegments} current={U.File.size(bytesUsed)} max={U.File.size(bytesLimit)} />
				</div>

				{canWrite ? (
					<div className="fileManagerWrapper">
						<Title className="sub" text={translate('pageSettingsSpaceCleanupSpaceFiles')} />

						<ListObjectManager
							ref={ref => this.refManager = ref}
							subId={J.Constant.subId.fileManager}
							rowLength={2}
							buttons={buttons}
							info={I.ObjectManagerItemInfo.FileSize}
							iconSize={18}
							sorts={sorts}
							filters={filters}
							ignoreHidden={false}
							ignoreArchived={false}
							textEmpty={translate('popupSettingsSpaceStorageManagerEmptyLabel')}
						/>
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		analytics.event('ScreenSettingsSpaceStorageManager');
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

	onRemove () {
		Action.delete(this.refManager.getSelected(), analytics.route.settings, () => this.refManager?.selectionClear());
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

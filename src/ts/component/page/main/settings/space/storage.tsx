import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, ListObjectManager, Label, ProgressBar, UpsellBanner } from 'Component';
import { I, J, U, S, translate, Action, analytics } from 'Lib';

const PageMainSettingsStorage = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { isPopup } = props;
	const { spaceStorage } = S.Common;
	const { bytesLimit } = spaceStorage;
	const { notSyncedCounter } = S.Auth.getSyncStatus();
	const spaces = U.Space.getList();
	const currentSpace = U.Space.getSpaceview();
	const isOwner = U.Space.isMyOwner();
	const usageCn = [ 'item', 'usageWrapper' ];
	const canWrite = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const managersRef = useRef<any>({});
	const segments: any = {
		current: { name: currentSpace.name, usage: 0, className: 'current', },
	};

	let bytesUsed = 0;

	(spaces || []).forEach((space) => {
		const object: any = S.Common.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
		const usage = Number(object.bytesUsage) || 0;
		const isOwner = U.Space.isMyOwner(space.targetSpaceId);
		const isCurrent = space.targetSpaceId == currentSpace.targetSpaceId;

		if (!isOwner) {
			return;
		};

		bytesUsed += usage;
		if (isCurrent) {
			segments.current.usage = usage;
		} else {
			if (segments.other) {
				segments.other.usage += usage;
			} else {
				segments.other = { name: translate('popupSettingsSpaceStorageProgressBarOther'), usage, className: 'other' };
			};
		};
	});

	const chunks: any[] = Object.values(segments);
	const progressSegments = (chunks || []).map(chunk => {
		const { name, usage, className } = chunk;

		return { name, className, caption: U.File.size(usage), percent: usage / bytesLimit, isActive: true, };
	});

	const usagePercent = bytesUsed / bytesLimit;
	const isRed = (usagePercent >= 100) || notSyncedCounter;
	const legend = chunks.concat([ { name: translate('popupSettingsSpaceStorageProgressBarFree'), usage: bytesLimit - bytesUsed, className: 'free' } ]);

	if (isRed) {
		usageCn.push('red');
	};

	const [ currentTab, setCurrentTab ] = useState('synced');
	const tabs: any[] = [
		{
			id: 'synced',
			subId: J.Constant.subId.fileManagerSynced,
			filters: [ I.SyncStatusObject.Synced ],
			title: translate('pageSettingsSpaceSynced'),
		}
	];

	if (notSyncedCounter) {
		tabs.push({
			id: 'notSynced',
			subId: J.Constant.subId.fileManagerNotSynced,
			filters: [ I.SyncStatusObject.Error ],
			title: translate('pageSettingsSpaceNotSynced')
		});
	};

	const currentManager = notSyncedCounter ? tabs.find(it => it.id == currentTab) : tabs[0];

	const Manager = (item: any) => {
		const { refId } = item;
		const buttons: I.ButtonComponent[] = [
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: () => onRemove(refId) }
		];
		const filters: I.Filter[] = [
			{ relationKey: 'syncStatus', condition: I.FilterCondition.In, value: item.filters },
			{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
		];

		if (!isOwner) {
			const participant = U.Space.getMyParticipant();
			
			filters.push({ relationKey: 'creator', condition: I.FilterCondition.Equal, value: participant?.id });
		};

		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'sizeInBytes' },
		];

		return (
			<ListObjectManager
				ref={ref => managersRef.current[refId] = ref}
				subId={item.subId}
				buttons={buttons}
				info={I.ObjectManagerItemInfo.FileSize}
				isCompact={true}
				sorts={sorts}
				filters={filters}
				keys={U.Subscription.syncStatusRelationKeys().concat([ 'creator' ])}
				ignoreHidden={false}
				ignoreArchived={false}
				textEmpty={translate('popupSettingsSpaceStorageEmptyLabel')}
			/>
		);
	};

	const onRemove = (refId: string) => {
		const ref = managersRef.current[refId];

		if (ref) {
			Action.delete(ref.getSelected(), analytics.route.settings, () => ref?.selectionClear());
		};
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const sc = U.Common.getScrollContainer(isPopup);
		const height = sc.height() - J.Size.header - 36;

		node.css({ height });
	};

	useEffect(() => {
		resize();

		return () => {
			U.Subscription.destroyList([ J.Constant.subId.fileManagerSynced, J.Constant.subId.fileManagerNotSynced ]);
		};
	}, []);

	return (
		<div ref={nodeRef} className="wrap">
			<UpsellBanner components={[ 'storage' ]} route={analytics.route.settingsStorage} />

			<Title text={translate(`pageSettingsSpaceRemoteStorage`)} />
			<Label text={translate(`popupSettingsSpaceIndexStorageText`)} />

			{isOwner ? (
				<div className={usageCn.join(' ')}>
					<ProgressBar segments={progressSegments} />

					<div className="info">
						<div className="totalUsage">
							<span>{U.File.size(bytesUsed, true)} </span>
							{U.String.sprintf(translate('popupSettingsSpaceStorageProgressBarUsageLabel'), U.File.size(bytesLimit, true))}
						</div>

						<div className="legend">
							{legend.map((item, idx) => (
								<div key={idx} className={[ 'item', item.className ].join(' ')}>{item.name}</div>
							))}
						</div>
					</div>
				</div>
			) : ''}

			{canWrite ? (
				<div className="fileManagerWrapper">
					<div className="tabs">
						{tabs.map(tab => (
							<Label
								key={tab.id}
								text={tab.title}
								className={tab.id == currentTab ? 'active' : ''}
								onClick={() => setCurrentTab(tab.id)}
							/>
						))}
					</div>

					<Manager
						refId={currentManager.id}
						subId={currentManager.subId}
						filters={currentManager.filters}
					/>
				</div>
			) : ''}
		</div>
	);

}));

export default PageMainSettingsStorage;

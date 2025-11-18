import React, { forwardRef, useEffect, useRef } from 'react';
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

	const Manager = (item: any) => {
		const { refId } = item;
		const buttons: I.ButtonComponent[] = [
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: () => onRemove(refId) }
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
					ref={ref => managersRef.current[refId] = ref}
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

			<div className={usageCn.join(' ')}>
				<ProgressBar segments={progressSegments} />

				<div className="info">
					<div className="totalUsage">
						<span>{U.File.size(bytesUsed, true)} </span>
						{U.Common.sprintf(translate('popupSettingsSpaceStorageProgressBarUsageLabel'), U.File.size(bytesLimit, true))}
					</div>

					<div className="legend">
						{legend.map((item, idx) => (
							<div key={idx} className={[ 'item', item.className ].join(' ')}>{item.name}</div>
						))}
					</div>
				</div>
			</div>

			{notSyncedCounter && canWrite ? (
				<Manager
					refId="notSynced"
					subId={J.Constant.subId.fileManagerNotSynced}
					title={translate('pageSettingsSpaceNotSyncedFiles')}
					filters={[ I.SyncStatusObject.Error ]}
				/>
			) : ''}

			{canWrite ? (
				<Manager
					refId="synced"
					subId={J.Constant.subId.fileManagerSynced}
					title={translate('pageSettingsSpaceSyncedFiles')}
					filters={[ I.SyncStatusObject.Synced ]}
				/>
			) : ''}
		</div>
	);

}));

export default PageMainSettingsStorage;
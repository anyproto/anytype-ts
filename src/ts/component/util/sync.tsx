import React, { forwardRef, useRef, MouseEvent } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	id?: string;
	className?: string;
	tooltipParam?: Partial<I.TooltipParam>;
	onClick: (e: any) => void;
};

const Sync = forwardRef<HTMLDivElement, Props>(({
	id = '',
	className = '',
	tooltipParam = {},
	onClick,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const syncStatus = S.Auth.getSyncStatus(S.Common.space);
	const { status, network } = syncStatus;
	const cn = [ 'sync', className ];
	const tooltip = U.Data.isDevelopmentNetwork() ? translate('syncButtonStaging') : translate('menuSyncStatusTitle');
	const hasStatus = !!syncStatus.id;
	const statusKey = !hasStatus ? 'Synced' : (network == I.SyncStatusNetwork.LocalOnly ? 'Offline' : I.SyncStatusSpace[status]);

	if (syncStatus.error) {
		cn.push(`error${I.SyncStatusError[syncStatus.error]}`);
	};

	const syncIconMap: Record<string, { name: string; color?: string; cn?: string }> = {
		Synced: { name: 'sync/globe' },
		Syncing: { name: 'sync/globe', cn: 'syncing' },
		Error: { name: 'sync/globe', color: 'red' },
		Offline: { name: 'sync/offline' },
		Upgrade: { name: 'sync/globe', color: 'darkOrange' },
	};

	const iconInfo = syncIconMap[statusKey] || syncIconMap.Synced;
	const iconCn = [ (iconInfo.cn || '') ];

	const onClickHandler = (e: MouseEvent) => {
		onClick?.(e);
		analytics.event('ClickSyncStatus', { status });
	};

	return (
		<div
			ref={nodeRef}
			id={id}
			className={cn.join(' ')}
			onClick={onClickHandler}
			onMouseEnter={e => Preview.tooltipShow({ text: tooltip, element: e.currentTarget as HTMLElement, ...tooltipParam })}
			onMouseLeave={() => Preview.tooltipHide(false)}
		>
			<Icon name={iconInfo.name} color={iconInfo.color} className={iconCn.join(' ')} />
		</div>
	);

});

export default Sync;

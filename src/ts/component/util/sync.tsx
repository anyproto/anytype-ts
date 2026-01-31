import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, analytics, translate, Preview } from 'Lib';

interface Props {
	id?: string;
	className?: string;
	onClick: (e: any) => void;
};

const Sync = observer(forwardRef<HTMLDivElement, Props>(({
	id = '',
	className = '',
	onClick,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const syncStatus = S.Auth.getSyncStatus(S.Common.space);
	const { status, network } = syncStatus;
	const cn = [ 'sync', className ];
	const tooltip = U.Data.isDevelopmentNetwork() ? translate('syncButtonStaging') : translate('menuSyncStatusTitle');
	const icon = network == I.SyncStatusNetwork.LocalOnly ? I.SyncStatusSpace.Offline : I.SyncStatusSpace[status];

	if (syncStatus.error) {
		cn.push(`error${I.SyncStatusError[syncStatus.error]}`);
	};

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
			onMouseEnter={e => Preview.tooltipShow({ text: tooltip, element: $(e.currentTarget), typeY: I.MenuDirection.Bottom })}
			onMouseLeave={() => Preview.tooltipHide(false)}
		>
			<Icon className={String(icon).toLowerCase()} />
		</div>
	);

}));

export default Sync;

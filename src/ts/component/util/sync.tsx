import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, analytics, translate } from 'Lib';

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
	const syncStatus = S.Auth.getSyncStatus();
	const isDevelopment = U.Data.isDevelopmentNetwork();
	const cn = [ 'sync', className ];

	if (syncStatus.error) {
		cn.push(`error${I.SyncStatusError[syncStatus.error]}`);
	};

	const onClickHandler = (e: MouseEvent) => {
		if (onClick) {
			onClick(e);
		};

		analytics.event('ClickSyncStatus', { status: syncStatus.status });
	};

	const getIcon = (): string => {
		const { status, network } = syncStatus;
		const icon = network == I.SyncStatusNetwork.LocalOnly ? I.SyncStatusSpace.Offline : I.SyncStatusSpace[status];

		return String(icon).toLowerCase();
	};

	return (
		<div 
			ref={nodeRef}
			id={id} 
			className={cn.join(' ')} 
			onClick={onClickHandler}
		>
			<Icon tooltipParam={{ text: isDevelopment ? translate('syncButtonStaging') : '' }} className={getIcon()} />
		</div>
	);

}));

export default Sync;
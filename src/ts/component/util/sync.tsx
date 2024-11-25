import React, { forwardRef, useRef, MouseEvent } from 'react';
import { useLocalObservable } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, S, J, analytics, translate } from 'Lib';

interface Props {
	id?: string;
	className?: string;
	onClick: (e: any) => void;
};

const Sync = forwardRef<HTMLDivElement, Props>(({
	id = '',
	className = '',
	onClick,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const syncStatus = useLocalObservable(() => S.Auth.getSyncStatus());
	const account = useLocalObservable(() => S.Auth.account);
	const isStaging = account?.info?.networkId == J.Constant.networkId.development;
	const cn = [ 'sync', className ];

	if (syncStatus.error) {
		cn.push(`error${I.SyncStatusError[syncStatus.error]}`);
	};

	const onClickHandler = (e: MouseEvent) => {
		const syncStatus = S.Auth.getSyncStatus();

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
			<Icon className={getIcon()} />
			{isStaging ? <Label className="badge" text={translate('syncButtonStaging')} /> : ''}
		</div>
	);
});

export default Sync;
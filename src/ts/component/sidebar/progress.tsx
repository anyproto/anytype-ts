import React, { FC, memo, useRef, useEffect, useState, useCallback } from 'react';
import Icon from 'Component/util/icon';
import Label from 'Component/util/label';
import * as I from 'Interface';

const AUTO_EXPAND = true;
const SKIP_STATE = [ I.ProgressState.Done, I.ProgressState.Canceled ];

const getIconName = (type: I.ProgressType): string => {
	switch (type) {
		case I.ProgressType.Update:		return 'popup/header/update';
		case I.ProgressType.Import:		return 'menu/action/import';
		case I.ProgressType.Export:		return 'menu/action/export';
		default:						return 'menu/action/download';
	};
};

interface ItemStatusProps {
	type: I.ProgressType;
	current: number;
	total: number;
	error?: string;
};

const ItemStatus: FC<ItemStatusProps> = memo(({ type, current, total, error }) => {
	if (error) {
		return <span className="error">{error}</span>;
	};

	const percent = total > 0 ? Math.min(100, Math.ceil(current / total * 100)) : 0;
	const status = translate(U.String.toCamelCase(`progress-status-${type}`));

	return <span>{percent}% <span className="dot" /> {status}</span>;
});

export interface ProgressItemProps {
	id: string;
	type: I.ProgressType;
	canCancel: boolean;
	isError: boolean;
	current?: number;
	total?: number;
	error?: string;
	onCancel?: (id: string) => void;
};

export const ProgressItem: FC<ProgressItemProps> = memo(({ id, type, canCancel, isError, current, total, error, onCancel }: ProgressItemProps) => {
	const cn = [ 'item' ];
	const label = translate(U.String.toCamelCase(`progress-${type}`));
	const iconName = getIconName(type);

	if (canCancel) {
		cn.push('canCancel');
	};

	const handleCancel = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (onCancel) {
			onCancel(id);
		} else {
			C.ProcessCancel(id);
		};
	};

	return (
		<div className={cn.join(' ')}>
			<div className="iconWrap">
				<Icon name={iconName} className="progressType" />
			</div>

			<div className="info">
				<div className="name">{label}</div>
				<div className="status">
					<ItemStatus type={type} current={current || 0} total={total || 0} error={error} />
				</div>
			</div>

			<div className={[ 'spinnerWrap', (!isError ? 'withSpinner' : '') ].join(' ')}>
				{canCancel ? <Icon name="common/clear" onClick={handleCancel} /> : ''}
			</div>
		</div>
	);
});

const SidebarProgress: FC = () => {

	const list = S.Progress.getList(it => !SKIP_STATE.includes(it.state));
	const [ isExpanded, setIsExpanded ] = useState(false);
	const prevCount = useRef(0);

	const onHeadClick = useCallback(() => {
		setIsExpanded(v => !v);
	}, []);

	useEffect(() => {
		if ((list.length > 0) && (prevCount.current === 0) && AUTO_EXPAND) {
			setIsExpanded(true);
		};

		if (!list.length) {
			setIsExpanded(false);
		};

		prevCount.current = list.length;
	}, [ list.length ]);

	if (!list.length) {
		return null;
	};

	const headerText = U.String.sprintf(translate('progressProcessing'), list.length);

	return (
		<div className={[ 'sidebarProgress', (isExpanded ? 'isExpanded' : '') ].join(' ')}>
			<div className="head" onClick={onHeadClick}>
				<Label text={headerText} />
				<Icon name="arrow/button" size={8} className="arrow" />
			</div>

			{isExpanded ? (
				<div className="items">
					{list.map(item => {
						const isError = item.state == I.ProgressState.Error;
						const canCancel = item.canCancel && !isError;

						return (
							<ProgressItem
								key={item.id}
								id={item.id}
								type={item.type}
								canCancel={canCancel}
								isError={isError}
								current={item.current}
								total={item.total}
								error={item.error}
							/>
						);
					})}
				</div>
			) : ''}
		</div>
	);

};

export default SidebarProgress;

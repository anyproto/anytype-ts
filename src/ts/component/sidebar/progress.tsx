import React, { FC, memo, useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, S, U, C, translate } from 'Lib';

const AUTO_EXPAND = true;
const SKIP_STATE = [ I.ProgressState.Done, I.ProgressState.Canceled ];

const getIconClass = (type: I.ProgressType): string => {
	switch (type) {
		case I.ProgressType.Update:		return 'update';
		case I.ProgressType.Import:		return 'import';
		case I.ProgressType.Export:		return 'export';
		default:						return 'download';
	};
};

const ItemStatus = observer(({ id, type }: { id: string; type: I.ProgressType }) => {
	const item = S.Progress.getItem(id);

	if (!item) {
		return null;
	};

	const isError = item.state == I.ProgressState.Error;

	if (isError) {
		return <span className="error">{item.error}</span>;
	};

	const percent = item.total > 0 ? Math.min(100, Math.ceil(item.current / item.total * 100)) : 0;
	const status = translate(U.String.toCamelCase(`progress-status-${type}`));

	return <span>{percent}% <span className="dot" /> {status}</span>;
});

interface ItemProps {
	id: string;
	type: I.ProgressType;
	canCancel: boolean;
	isError: boolean;
};

const Item = memo(({ id, type, canCancel, isError }: ItemProps) => {
	const cn = [ 'item' ];
	const label = translate(U.String.toCamelCase(`progress-${type}`));
	const iconClass = getIconClass(type);

	if (canCancel) {
		cn.push('canCancel');
	};

	const onCancel = (e: React.MouseEvent) => {
		e.stopPropagation();
		C.ProcessCancel(id);
	};

	return (
		<div className={cn.join(' ')}>
			<div className={[ 'iconWrap', iconClass ].join(' ')}>
				<Icon className={`progressType ${iconClass}`} />
			</div>

			<div className="info">
				<div className="name">{label}</div>
				<div className="status">
					<ItemStatus id={id} type={type} />
				</div>
			</div>

			<div className={[ 'spinnerWrap', (!isError ? 'withSpinner' : '') ].join(' ')}>
				{canCancel ? <Icon name="common/close" onClick={onCancel} /> : ''}
			</div>
		</div>
	);
});

const SidebarProgress: FC = observer(() => {

	const list = S.Progress.getList(it => !SKIP_STATE.includes(it.state));
	const [ isExpanded, setIsExpanded ] = useState(false);
	const prevCount = useRef(0);

	useEffect(() => {
		if (AUTO_EXPAND && (list.length > 0) && (prevCount.current === 0)) {
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

	const onToggle = () => {
		setIsExpanded(!isExpanded);
	};

	const headerText = U.String.sprintf(translate('progressProcessing'), list.length);

	return (
		<div className={[ 'sidebarProgress', (isExpanded ? 'isExpanded' : '') ].join(' ')}>
			<div className="head" onClick={onToggle}>
				<Label text={headerText} />
				<Icon className="arrow" />
			</div>

			{isExpanded ? (
				<div className="items">
					{list.map(item => {
						const isError = item.state == I.ProgressState.Error;
						const canCancel = item.canCancel && !isError;

						return (
							<Item
								key={item.id}
								id={item.id}
								type={item.type}
								canCancel={canCancel}
								isError={isError}
							/>
						);
					})}
				</div>
			) : ''}
		</div>
	);

});

export default SidebarProgress;

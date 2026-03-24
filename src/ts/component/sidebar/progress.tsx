import React, { FC, memo, useRef, useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, S, U, C, J, translate, keyboard, Storage } from 'Lib';

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
	const iconClass = getIconClass(type);

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
			<div className={[ 'iconWrap', iconClass ].join(' ')}>
				<Icon className={`progressType ${iconClass}`} />
			</div>

			<div className="info">
				<div className="name">{label}</div>
				<div className="status">
					<ItemStatus type={type} current={current || 0} total={total || 0} error={error} />
				</div>
			</div>

			<div className={[ 'spinnerWrap', (!isError ? 'withSpinner' : '') ].join(' ')}>
				{canCancel ? <Icon name="common/close" onClick={handleCancel} /> : ''}
			</div>
		</div>
	);
});

const STORAGE_KEY = 'sidebarProgress';

const SidebarProgress: FC = observer(() => {

	const list = S.Progress.getList(it => !SKIP_STATE.includes(it.state));
	const [ isExpanded, setIsExpanded ] = useState(false);
	const nodeRef = useRef<HTMLDivElement>(null);
	const prevCount = useRef(0);
	const hasDragged = useRef(false);
	const startX = useRef(0);
	const startY = useRef(0);
	const dx = useRef(0);
	const dy = useRef(0);

	const clampCoords = useCallback((x: number, bottom: number): { x: number; bottom: number } => {
		const { ww, wh } = U.Common.getWindowDimensions();
		const node = nodeRef.current;
		const w = node ? node.offsetWidth : 0;
		const h = node ? node.offsetHeight : 0;

		x = Math.max(0, Math.min(ww - w, x));
		bottom = Math.max(0, Math.min(wh - h - J.Size.header, bottom));

		return { x, bottom };
	}, []);

	const setPosition = useCallback((x: number, bottom: number) => {
		const node = nodeRef.current;

		if (!node) {
			return;
		};

		const coords = clampCoords(x, bottom);

		node.style.position = 'fixed';
		node.style.left = `${coords.x}px`;
		node.style.bottom = `${coords.bottom}px`;
		node.style.top = 'auto';
	}, [ clampCoords ]);


	const onDragMove = useCallback((e: MouseEvent) => {
		const movedX = Math.abs(e.pageX - startX.current);
		const movedY = Math.abs(e.pageY - startY.current);

		if ((movedX > 3) || (movedY > 3)) {
			hasDragged.current = true;
		};

		const node = nodeRef.current;
		const { wh } = U.Common.getWindowDimensions();
		const h = node ? node.offsetHeight : 0;
		const x = e.pageX - dx.current;
		const bottom = wh - (e.pageY - dy.current) - h;

		setPosition(x, bottom);
		Storage.set(STORAGE_KEY, { x, bottom }, Storage.isLocal(STORAGE_KEY));
	}, [ setPosition ]);

	const onDragEnd = useCallback(() => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		window.removeEventListener('mousemove', onDragMove);
		window.removeEventListener('mouseup', onDragEnd);
	}, [ onDragMove ]);

	const onDragStart = useCallback((e: React.MouseEvent) => {
		const node = nodeRef.current;

		if (!node) {
			return;
		};

		const rect = node.getBoundingClientRect();

		dx.current = e.pageX - rect.left;
		dy.current = e.pageY - rect.top;
		startX.current = e.pageX;
		startY.current = e.pageY;
		hasDragged.current = false;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		window.addEventListener('mousemove', onDragMove);
		window.addEventListener('mouseup', onDragEnd);
	}, [ onDragMove, onDragEnd ]);

	const onHeadClick = useCallback(() => {
		if (!hasDragged.current) {
			setIsExpanded(v => !v);
		};
	}, []);

	useEffect(() => {
		if ((list.length > 0) && (prevCount.current === 0)) {
			Storage.delete(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

			const node = nodeRef.current;

			if (node) {
				node.style.position = '';
				node.style.left = '';
				node.style.bottom = '';
				node.style.top = '';
			};

			if (AUTO_EXPAND) {
				setIsExpanded(true);
			};
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
		<div ref={nodeRef} className={[ 'sidebarProgress', (isExpanded ? 'isExpanded' : '') ].join(' ')}>
			<div className="head" onMouseDown={onDragStart} onClick={onHeadClick}>
				<Label text={headerText} />
				<Icon name="arrow/menu/button" size={8} className="arrow" />
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

});

export default SidebarProgress;

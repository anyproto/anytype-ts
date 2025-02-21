import React, { FC, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Label, Error } from 'Component';
import { I, S, U, C, J, Storage, keyboard, translate } from 'Lib';

const Progress: FC = observer(() => {

	const { show } = S.Progress;
	const skipState = [ I.ProgressState.Done, I.ProgressState.Canceled ];
	const skipType = [ I.ProgressType.Migrate ];
	const list = S.Progress.getList(it => !skipType.includes(it.type) && !skipState.includes(it.state));
	const percent = S.Progress.getPercent(list);
	const nodeRef = useRef(null);
	const innerRef = useRef(null);
	const dx = useRef(0);
	const dy = useRef(0);
	const width = useRef(0);
	const height = useRef(0);
	const resizeObserver = new ResizeObserver(() => resize());
	const cn = [ 'progress' ];

	const Item = (item: any) => {
		const percent = item.total > 0 ? Math.min(100, Math.ceil(item.current / item.total * 100)) : 0;
		const isError = item.state == I.ProgressState.Error;
		const canCancel = item.canCancel && !isError;

		return (
			<div className="item">
				<div className="nameWrap">
					<Label text={translate(U.Common.toCamelCase(`progress-${item.type}`))} />
					{canCancel ? <Icon className="close" onClick={() => onCancel(item.id)} /> : ''}
				</div>

				{isError ? (
					<Error text={item.error} />
				) : (
					<div className="bar">
						<div className="fill" style={{width: `${percent}%` }} />
					</div>
				)}
			</div>
		);
	};

	const onCancel = (id: string) => {
		C.ProcessCancel(id);
	};

	const onDragStart = (e: any) => {
		const win = $(window);
		const offset = $(innerRef.current).offset();

		dx.current = e.pageX - offset.left;
		dy.current = e.pageY - offset.top;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		win.off('mousemove.progress mouseup.progress');
		win.on('mousemove.progress', e => onDragMove(e));
		win.on('mouseup.progress', e => onDragEnd(e));
	};

	const onDragMove = (e: any) => {
		const obj = Storage.get('progress') || {};
		const win = $(window);
		const x = e.pageX - dx.current - win.scrollLeft();
		const y = e.pageY - dy.current - win.scrollTop();

		setStyle(x, y);
		Storage.set('progress', { ...obj, x, y });
	};

	const onDragEnd = (e: any) => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		$(window).off('mousemove.progress mouseup.progress');
	};

	const checkCoords = (x: number, y: number): { x: number, y: number } => {
		const { ww, wh } = U.Common.getWindowDimensions();

		width.current = Number(width.current) || 0;
		height.current = Number(height.current) || 0;

		x = Number(x) || 0;
		x = Math.max(0, x);
		x = Math.min(ww - width.current, x);

		y = Number(y) || 0;
		y = Math.max(J.Size.header, y);
		y = Math.min(wh - height.current, y);

		return { x, y };
	};

	const resize = () => {
		const obj = $(innerRef.current);
		const coords = Storage.get('progress');

		height.current = obj.outerHeight();
		width.current = obj.outerWidth();

		if (coords) {
			setStyle(coords.x, coords.y);
		};
	};

	const setStyle = (x: number, y: number) => {
		const coords = checkCoords(x, y);

		$(innerRef.current).css({ margin: 0, left: coords.x, top: coords.y, bottom: 'auto' });
	};

	useEffect(() => {
		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		resize();

		return () => {
			if (nodeRef.current) {
				resizeObserver.unobserve(nodeRef.current);
			};
		};
	});

	useEffect(() => resize(), [ list.length ]);

	return show && list.length ? (
		<div 
			ref={nodeRef} 
			className={cn.join(' ')}
		>
			<div ref={innerRef} className="inner" onMouseDown={onDragStart}>
				<div className="titleWrap">
					<Label text={translate('commonProgress')} />
					<Label className="percent" text={`${percent}%`} />
				</div>
				<div className="items">
					{list.map(item => <Item key={item.id} {...item} />)}
				</div>
			</div>
		</div>
	) : null;

});

export default Progress;
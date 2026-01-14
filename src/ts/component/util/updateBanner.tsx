import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label, ProgressBar, Button } from 'Component';
import { I, S, U, J, translate, Renderer, keyboard, Storage, analytics } from 'Lib';

const STORAGE_KEY = 'updateBanner';

const UpdateBanner = observer(forwardRef<{}, {}>((props, ref) => {

	const { updateVersion } = S.Common;
	const cn = [ 'updateBanner' ];
	const nodeRef = useRef(null);
	const width = useRef(0);
	const height = useRef(0);
	const dx = useRef(0);
	const dy = useRef(0);
	const progress = S.Progress.getList(it => it.type == I.ProgressType.Update);

	let info = null;
	let buttons = null;

	const onDragStart = (e: any) => {
		const win = $(window);
		const offset = $(nodeRef.current).offset();

		dx.current = e.pageX - offset.left;
		dy.current = e.pageY - offset.top;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		win.off('mousemove.progress mouseup.progress');
		win.on('mousemove.progress', e => onDragMove(e));
		win.on('mouseup.progress', e => onDragEnd(e));
	};

	const onDragMove = (e: any) => {
		const obj = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY)) || {};
		const win = $(window);
		const x = e.pageX - dx.current - win.scrollLeft();
		const y = e.pageY - dy.current - win.scrollTop();

		setStyle(x, y);
		Storage.set(STORAGE_KEY, { ...obj, x, y }, Storage.isLocal(STORAGE_KEY));
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
		const obj = $(nodeRef.current);
		const coords = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

		height.current = obj.outerHeight();
		width.current = obj.outerWidth();

		if (coords) {
			setStyle(coords.x, coords.y);
		};
	};

	const setStyle = (x: number, y: number) => {
		const coords = checkCoords(x, y);

		$(nodeRef.current).css({ left: coords.x, top: coords.y, bottom: 'auto' });
	};

	useEffect(() => {
		if (updateVersion) {
			analytics.event('ScreenUpgradeVersion');
		};

		resize();
	}, [ updateVersion, progress.length ]);

	if (updateVersion) {
		cn.push('withButtons');

		info = (
			<div className="info">
				<div className="name">{translate('commonUpdateAvailable')}</div>
				<Label text={U.String.sprintf(translate('commonNewVersion'), updateVersion)} />
			</div>
		);

		buttons = (
			<div className="buttons">
				<Button 
					color="blank"
					className="c28"
					text={translate('commonLater')} 
					onClick={() => {
						S.Common.updateVersionSet('');
						Renderer.send('updateCancel');
						
						analytics.event('ClickCancelVersion');
					}}
				/>
				<Button 
					color="blank"
					className="c28"
					text={translate('commonUpdateApp')}
					onClick={() => {
						Renderer.send('updateConfirm');
						S.Common.updateVersionSet('');
						U.Common.checkUpdateVersion(updateVersion);

						analytics.event('ClickUpgradeVersion');
					}}
				/>
			</div>
		);

	} else {
		const obj = progress.length ? progress[0] : null;
		const segments = [];

		if (!obj) {
			return null;
		};

		let percent = 0;
		if (progress.length) {
			segments.push({ name: '', caption: '', percent: obj.current / obj.total, isActive: true });

			percent = S.Progress.getPercent(progress);
		};

		info = (
			<div className="info">
				<div className="nameWrapper">
					<div className="name">{translate('progressUpdateDownloading')}</div>
					<div className="percent">{percent}%</div>
				</div>
				<ProgressBar segments={segments} />
			</div>
		);
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')} onMouseDown={onDragStart}>
			<div className="infoWrapper">
				<Icon />
				{info}
			</div>
			{buttons}
		</div>
	);

}));

export default UpdateBanner;
import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label, Button } from 'Component';
import Storage from 'Lib/storage';

const STORAGE_KEY = 'updateBanner';

const UpdateBanner = observer(forwardRef<{}, {}>((props, ref) => {

	const { updateVersion } = S.Common;
	const cn = [ 'updateBanner', 'withButtons' ];
	const nodeRef = useRef(null);
	const width = useRef(0);
	const height = useRef(0);
	const dx = useRef(0);
	const dy = useRef(0);

	const checkCoords = useCallback((x: number, y: number): { x: number, y: number } => {
		const { ww, wh } = U.Dom.getWindowDimensions();

		width.current = Number(width.current) || 0;
		height.current = Number(height.current) || 0;

		x = Number(x) || 0;
		x = Math.max(0, x);
		x = Math.min(ww - width.current, x);

		y = Number(y) || 0;
		y = Math.max(J.Size.header, y);
		y = Math.min(wh - height.current, y);

		return { x, y };
	}, []);

	const setStyle = useCallback((x: number, y: number) => {
		const coords = checkCoords(x, y);

		$(nodeRef.current).css({ left: coords.x, top: coords.y, bottom: 'auto' });
	}, [ checkCoords ]);

	const resize = useCallback(() => {
		const obj = $(nodeRef.current);
		const coords = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

		height.current = obj.outerHeight();
		width.current = obj.outerWidth();

		if (coords) {
			setStyle(coords.x, coords.y);
		};
	}, [ setStyle ]);

	const onDragMove = useCallback((e: any) => {
		const obj = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY)) || {};
		const win = $(window);
		const x = e.pageX - dx.current - win.scrollLeft();
		const y = e.pageY - dy.current - win.scrollTop();

		setStyle(x, y);
		Storage.set(STORAGE_KEY, { ...obj, x, y }, Storage.isLocal(STORAGE_KEY));
	}, [ setStyle ]);

	const onDragEnd = useCallback((e: any) => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		$(window).off('mousemove.progress mouseup.progress');
	}, []);

	const onDragStart = useCallback((e: any) => {
		const win = $(window);
		const offset = $(nodeRef.current).offset();

		dx.current = e.pageX - offset.left;
		dy.current = e.pageY - offset.top;

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		win.off('mousemove.progress mouseup.progress');
		win.on('mousemove.progress', e => onDragMove(e));
		win.on('mouseup.progress', e => onDragEnd(e));
	}, [ onDragMove, onDragEnd ]);

	useEffect(() => {
		if (updateVersion) {
			analytics.event('ScreenUpgradeVersion');
		};

		resize();
	}, [ updateVersion ]);

	if (!updateVersion) {
		return null;
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')} onMouseDown={onDragStart}>
			<div className="infoWrapper">
				<Icon />
				<div className="info">
					<div className="name">{translate('commonUpdateAvailable')}</div>
					<Label text={U.String.sprintf(translate('commonNewVersion'), updateVersion)} />
				</div>
			</div>
			<div className="buttons">
				<Button
					color="blank"
					size={28}
					text={translate('commonLater')}
					onClick={() => {
						S.Common.updateVersionSet('');
						Renderer.send('updateCancel');

						analytics.event('ClickCancelVersion');
					}}
				/>
				<Button
					color="blank"
					size={28}
					text={translate('commonUpdateApp')}
					onClick={() => {
						Renderer.send('updateConfirm');
						S.Common.updateVersionSet('');
						U.Common.checkUpdateVersion(updateVersion);

						analytics.event('ClickUpgradeVersion');
					}}
				/>
			</div>
		</div>
	);

}));

export default UpdateBanner;

import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Icon, Label, Button } from 'Component';
import Storage from 'Lib/storage';

const STORAGE_KEY = 'updateBanner';

const UpdateBanner = forwardRef<{}, {}>((props, ref) => {

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

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const setStyle = useCallback((x: number, y: number) => {
		const coords = checkCoords(x, y);
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		U.Dom.css(node, { left: `${coords.x}px`, top: `${coords.y}px`, bottom: 'auto' });
	}, [ checkCoords ]);

	const resize = useCallback(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const coords = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

		height.current = node.offsetHeight;
		width.current = node.offsetWidth;

		if (coords) {
			setStyle(coords.x, coords.y);
		};
	}, [ setStyle ]);

	const onDragMove = useCallback((e: any) => {
		const obj = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY)) || {};
		const x = e.pageX - dx.current - window.scrollX;
		const y = e.pageY - dy.current - window.scrollY;

		setStyle(x, y);
		Storage.set(STORAGE_KEY, { ...obj, x, y }, Storage.isLocal(STORAGE_KEY));
	}, [ setStyle ]);

	const onDragEnd = useCallback((e: any) => {
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};
	}, []);

	const onDragStart = useCallback((e: any) => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const rect = node.getBoundingClientRect();

		dx.current = e.pageX - (rect.left + window.scrollX);
		dy.current = e.pageY - (rect.top + window.scrollY);

		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = e => onDragMove(e);
		mouseUpHandler.current = e => onDragEnd(e);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
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

});

export default UpdateBanner;

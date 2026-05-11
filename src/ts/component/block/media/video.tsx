import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { MediaPlaceholder, Icon, Error, MediaVideo, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockVideo = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const wrapRef = useRef<any>(null);
	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { id, fields, content } = block;
	const { state, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const { width } = fields;
	const css: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const width = Number(fields.width) || 1;
		const el = U.Dom.get(`selectionTarget-${id}`);

		if (!el) {
			return width;
		};

		const ew = U.Dom.contentWidth(el);
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const onPlay = () => {
		U.Dom.addClass(nodeRef.current, 'isPlaying');
	};

	const onPause = () => {
		U.Dom.removeClass(nodeRef.current, 'isPlaying');
	};

	const onKeyDownHandler = (e: any) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};
	
	const onKeyUpHandler = (e: any) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const onFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	const onPlaceholderClick = (e: any) => {
		e.stopPropagation();

		S.Menu.open('blockMedia', {
			element: `#block-${id}`,
			data: {
				rootId,
				blockId: id,
				type: I.FileType.Video,
			},
		});
	};

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const onResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		selection?.hide();
		keyboard.setResize(true);
		keyboard.disableSelection(true);
		U.Dom.addClass(nodeRef.current, 'isResizing');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = e => onResizeMove(e, checkMax);
		mouseUpHandler.current = e => onResizeEnd(e, checkMax);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
	};

	const onResizeMove = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		if (!wrapRef.current) {
			return;
		};

		const rect = U.Dom.getElementRect(wrapRef.current);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		U.Dom.css(wrapRef.current, { width: (w * 100) + '%' });
	};

	const onResizeEnd = (e: any, checkMax: boolean) => {
		if (!wrapRef.current) {
			return;
		};

		const rect = U.Dom.getElementRect(wrapRef.current);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};

		U.Dom.removeClass(nodeRef.current, 'isResizing');
		keyboard.disableSelection(false);
		keyboard.setResize(false);

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	};

	useImperativeHandle(ref, () => ({}));

	const typeName = translate('blockNameVideo');
	const overlay = <MediaState object={object} rootId={rootId} typeName={typeName} />;

	let element = null;

	if (object.isArchived && (state == I.FileState.Done)) {
		element = (
			<div ref={wrapRef} className="wrap" style={css}>
				<MediaVideo
					src={S.Common.fileUrl(targetObjectId)}
					onPlay={onPlay}
					onPause={onPause}
				/>
				{overlay}
			</div>
		);
	} else
	if (object.isDeleted || object.isArchived) {
		element = overlay;
	} else {
		switch (state) {
			default:
			case I.FileState.Error:
			case I.FileState.Empty: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<MediaPlaceholder
							iconParam={{ name: 'menu/block/media/video' }}
							text={translate('blockVideoAdd')}
							onClick={onPlaceholderClick}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.FileState.Done: {
				element = (
					<div ref={wrapRef} className="wrap" style={css}>
						<MediaVideo
							src={S.Common.fileUrl(targetObjectId)}
							onPlay={onPlay}
							onPause={onPause}
						/>
						<Icon name="common/resize" className="resize" onMouseDown={e => onResizeStart(e, false)} />
					</div>
				);
				break;
			};
		};
	};
	
	return (
		<div 
			ref={nodeRef} 
			className={[ `focusable`, `c${id}` ].join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{element}
		</div>
	);
	
});

export default BlockVideo;
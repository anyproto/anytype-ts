import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { InputWithFile, Icon, Error } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockImage = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { width } = block.fields || {};
	const { state } = block.content;
	const targetObjectId = block.getTargetObjectId();
	const nodeRef = useRef(null);
	const wrapRef = useRef(null);

	const handleKeyDown = (e: any) => {
		onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const handleKeyUp = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const handleFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	const handleChangeUrl = (e: any, url: string) => {
		Action.upload(I.FileType.Image, rootId, block.id, url, '');
	};

	const handleChangeFile = (e: any, path: string) => {
		Action.upload(I.FileType.Image, rootId, block.id, '', path);
	};

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const handleResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		focus.set(block.id, { from: 0, to: 0 });
		selection?.hide();
		keyboard.disableSelection(true);
		U.Dom.addClass(nodeRef.current, 'isResizing');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
		};

		mouseMoveHandler.current = e => handleResize(e, checkMax);
		mouseUpHandler.current = e => handleResizeEnd(e, checkMax);
		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandler.current],
			['mouseup', mouseUpHandler.current],
		]);
	};

	const handleResize = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		if (!wrapRef.current) {
			return;
		};

		const rect = U.Dom.getElementRect(wrapRef.current);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		U.Dom.css(wrapRef.current, { width: (w * 100) + '%' });
	};

	const handleResizeEnd = (e: any, checkMax: boolean) => {
		if (!wrapRef.current) {
			return;
		};

		const ox = wrapRef.current.getBoundingClientRect().left + window.scrollX;
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - ox + 20));

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

		C.BlockListSetFields(rootId, [ { blockId: block.id, fields: { width: w } } ]);
	};

	const handleError = () => {
		U.Dom.addClass(wrapRef.current, 'brokenMedia');
	};

	const handleClick = (e: any) => {
		if (keyboard.withCommand(e)) {
			return;
		};

		const root = S.Block.wrapTree(rootId, rootId);
		const blocks = S.Block.unwrapTree([ root ]).filter(it => it.isFileImage() || it.isFileVideo());
		const gallery: any[] = [];

		blocks.forEach(it => {
			const target = it.getTargetObjectId();
			const type = it.isFileImage() ? I.FileType.Image : I.FileType.Video;
			const object = S.Detail.get(rootId, target, []);

			if (object._empty_ || object.isDeleted) {
				return;
			};

			let src = '';
			switch (object.layout) {
				case I.ObjectLayout.Image: {
					src = S.Common.imageUrl(target, I.ImageSize.Large);
					break;
				};

				case I.ObjectLayout.Video: {
					src = S.Common.fileUrl(target);
					break;
				};
			};

			if (src) {
				gallery.push({ id: it.id, object, src, type });
			};
		});

		S.Popup.open('preview', { 
			data: { 
				initialIdx: gallery.findIndex(it => it.id == block.id), 
				gallery 
			},
		});
	};

	const isDownloading = S.Common.isDownloading(targetObjectId);

	const handleDownload = () => {
		Action.downloadFile(targetObjectId, analytics.route.block, block.isFileImage());
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const el = U.Dom.get(`selectionTarget-${U.Common.esc(block.id)}`);
		const width = Number(block.fields.width) || 1;

		if (!el) {
			return width;
		};

		const ew = U.Dom.contentWidth(el);
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const object = S.Detail.get(rootId, targetObjectId, []);
	const cn = [ 'focusable', `c${block.id}` ];
	const css: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	let element = null;
	let overlay = null;
	const typeName = translate('blockNameImage');

	if (object.isDeleted) {
		element = (
			<div className="mediaState isRemoved">
				<Icon name="common/ghost" />
				<div className="name">{U.String.sprintf(translate('commonObjectRemovedShort'), typeName)}</div>
			</div>
		);
	} else if (object.isArchived) {
		overlay = (
			<div className="mediaState isInBin">
				<Icon name="common/ghost" />
				<div className="name">{U.String.sprintf(translate('commonObjectInBin'), typeName, U.File.name(object))}</div>
			</div>
		);
		if (state == I.FileState.Done) {
			element = (
				<div ref={wrapRef} className="wrap" style={css}>
					<img
						className="mediaImage"
						src={S.Common.imageUrl(targetObjectId, I.ImageSize.Large)}
						onDragStart={e => e.preventDefault()}
						onError={handleError}
					/>
					{overlay}
				</div>
			);
		} else {
			element = overlay;
		};
	} else {
		switch (state) {
			default: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile
							block={block}
							iconParam={{ name: 'menu/block/media/image' }}
							textFile={translate('blockImageUpload')}
							accept={J.Constant.fileExtension.image}
							onChangeUrl={handleChangeUrl}
							onChangeFile={handleChangeFile}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.FileState.Done: {
				element = (
					<div ref={wrapRef} className="wrap" style={css}>
						<img
							className="mediaImage"
							src={S.Common.imageUrl(targetObjectId, I.ImageSize.Large)}
							onDragStart={e => e.preventDefault()}
							onClick={handleClick}
							onError={handleError}
						/>
						{isDownloading ? <Icon className="downloading" /> : <Icon name="common/download" className="download" onClick={handleDownload} />}
						<Icon name="common/resize" className="resize" onMouseDown={e => handleResizeStart(e, false)} />
					</div>
				);
				break;
			};
		};
	};

	useImperativeHandle(ref, () => ({}));

	return (
		<div 
			ref={nodeRef} 
			className={cn.join(' ')}
			tabIndex={0} 
			onKeyDown={handleKeyDown} 
			onKeyUp={handleKeyUp} 
			onFocus={handleFocus}
		>
			{element}
		</div>
	);
});

export default BlockImage;

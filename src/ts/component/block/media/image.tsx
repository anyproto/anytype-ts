import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Loader, Icon, Error } from 'Component';
import { I, C, S, J, translate, focus, Action, keyboard, analytics } from 'Lib';

const BlockImage = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { width } = block.fields || {};
	const { state } = block.content;
	const targetObjectId = block.getTargetObjectId();
	const nodeRef = useRef(null);
	const wrapRef = useRef(null);

	const handleKeyDown = (e: any) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const handleKeyUp = (e: any) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
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

	const handleResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(nodeRef.current);

		focus.set(block.id, { from: 0, to: 0 });
		selection?.hide();
		keyboard.disableSelection(true);
		node.addClass('isResizing');

		win.off('mousemove.media mouseup.media');
		win.on('mousemove.media', e => handleResize(e, checkMax));
		win.on('mouseup.media', e => handleResizeEnd(e, checkMax));
	};

	const handleResize = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const wrap = $(wrapRef.current);
		if (!wrap.length) {
			return;
		};

		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = getWidth(checkMax, e.pageX - rect.x + 20);

		wrap.css({ width: (w * 100) + '%' });
	};

	const handleResizeEnd = (e: any, checkMax: boolean) => {
		const wrap = $(wrapRef.current);
		if (!wrap.length) {
			return;
		};

		const node = $(nodeRef.current);
		const win = $(window);
		const ox = wrap.offset().left;
		const w = getWidth(checkMax, e.pageX - ox + 20);

		win.off('mousemove.media mouseup.media');
		node.removeClass('isResizing');
		keyboard.disableSelection(false);

		C.BlockListSetFields(rootId, [ { blockId: block.id, fields: { width: w } } ]);
	};

	const handleLoad = () => {
		$(window).trigger('resize');
	};

	const handleError = () => {
		$(wrapRef.current).addClass('brokenMedia');
	};

	const handleClick = (e: any) => {
		if (keyboard.withCommand(e)) {
			return;
		};

		const blocks = S.Block.getBlocks(rootId, (it: I.Block) => it.isFileImage() || it.isFileVideo());
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

			gallery.push({ object, src, type });
		});

		S.Popup.open('preview', { data: { initialIdx: gallery.findIndex(it => it.object.id == targetObjectId), gallery } });
	};

	const handleDownload = () => {
		Action.downloadFile(targetObjectId, analytics.route.block, block.isFileImage());
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const el = $(`#selectionTarget-${block.id}`);
		const width = Number(block.fields.width) || 1;

		if (!el.length) {
			return width;
		};
		
		const ew = el.width();
		const w = Math.min(ew, Math.max(60, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const object = S.Detail.get(rootId, targetObjectId, []);
	const css: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	let element = null;
	if (object.isDeleted) {
		element = (
			<div className="deleted">
				<Icon className="ghost" />
				<div className="name">{translate('commonDeletedObject')}</div>
			</div>
		);
	} else {
		switch (state) {
			default: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="image" 
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

			case I.FileState.Uploading: {
				element = <Loader />;
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
							onLoad={handleLoad} 
							onError={handleError} 
						/>
						<Icon className="download" onClick={handleDownload} />
						<Icon className="resize" onMouseDown={e => handleResizeStart(e, false)} />
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
			className={[ 'focusable', 'c' + block.id ].join(' ')} 
			tabIndex={0} 
			onKeyDown={handleKeyDown} 
			onKeyUp={handleKeyUp} 
			onFocus={handleFocus}
		>
			{element}
		</div>
	);
}));

export default BlockImage;
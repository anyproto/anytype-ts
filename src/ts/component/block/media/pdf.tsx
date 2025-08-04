import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { InputWithFile, Loader, Error, Pager, Icon, MediaPdf, ObjectName } from 'Component';
import { I, C, S, U, J, translate, focus, Action, keyboard, analytics } from 'Lib';
import { observer } from 'mobx-react';

const BlockPdf = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
	const [pages, setPages] = useState(0);
	const [page, setPage] = useState(1);
	const nodeRef = useRef<any>(null);
	const wrapRef = useRef<any>(null);
	const mediaRef = useRef<any>(null);
	const heightRef = useRef(0);

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { id, fields, content } = block;
	const { state, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const width = Number(fields.width) || 0;
	const css: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	if (heightRef.current) {
		css.minHeight = heightRef.current;
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const width = Number(fields.width) || 1;
		const el = $(`#selectionTarget-${id}`);

		if (!el.length) {
			return width;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		const w = Math.min(rect.width, Math.max(160, checkMax ? width * rect.width : v));
		
		return Math.min(1, Math.max(0, w / rect.width));
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
	
	const onChangeUrl = (e: any, url: string) => {
		Action.upload(I.FileType.Pdf, rootId, id, url, '');
	};
	
	const onChangeFile = (e: any, path: string) => {
		Action.upload(I.FileType.Pdf, rootId, id, '', path);
	};

	const onDocumentLoad = (result: any) => {
		setPages(result.numPages);
	};

	const onPageRender = () => {
		heightRef.current = $(wrapRef.current).outerHeight();
	};

	const onOpenFile = () => {
		Action.openFile(block.getTargetObjectId(), analytics.route.block);
	};

	const onOpenObject = (e: any) => {
		if (!keyboard.withCommand(e)) {
			U.Object.openConfig({ id: block.getTargetObjectId(), layout: I.ObjectLayout.Pdf });
		};
	};

	const onResizeInit = () => {
		const wrap = $(wrapRef.current);
		
		if (wrap.length) {
			wrap.css({ width: (getWidth(true, 0) * 100) + '%' });
		};

		mediaRef.current?.resize();
	};

	const onResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.media mouseup.media');
		selection?.hide();

		$(`#block-${block.id}`).addClass('isResizing');

		keyboard.setResize(true);
		keyboard.disableSelection(true);
		win.on('mousemove.media', e => onResizeMove(e, checkMax));
		win.on('mouseup.media', e => onResizeEnd(e, checkMax));
	};
	
	const onResizeMove = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		const wrap = $(wrapRef.current);
		
		if (!wrap.length) {
			return;
		};
		
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = getWidth(checkMax, e.pageX - rect.x + 20);
		
		wrap.css({ width: (w * 100) + '%' });
		mediaRef.current?.resize();
	};
	
	const onResizeEnd = (e: any, checkMax: boolean) => {
		const wrap = $(wrapRef.current);
		
		if (!wrap.length) {
			return;
		};
		
		const win = $(window);
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = getWidth(checkMax, e.pageX - rect.x + 20);
		
		$(`#block-${block.id}`).removeClass('isResizing');

		win.off('mousemove.media mouseup.media');
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		
		heightRef.current = 0;

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, width: w } },
		]);
	};

	const rebind = () => {
		const node = $(nodeRef.current);
		
		unbind();
		node.on('resizeStart', (e: any, oe: any) => onResizeStart(oe, true));
		node.on('resizeMove', (e: any, oe: any) => onResizeMove(oe, true));
		node.on('resizeEnd', (e: any, oe: any) => onResizeEnd(oe, true));
		node.on('resizeInit', (e: any, oe: any) => onResizeInit());
	};

	const unbind = () => {
		const node = $(nodeRef.current);
		const video = node.find('video');
		
		node.off('resizeInit resizeStart resizeMove resizeEnd');
		video.off('canplay');
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, [ rebind, unbind ]);

	useEffect(() => {
		rebind();
	});

	useImperativeHandle(ref, () => ({}));

	let element = null;
	let pager = null;

	if (object.isDeleted) {
		element = (
			<div className="deleted">
				<Icon className="ghost" />
				<div className="name">{translate('commonDeletedObject')}</div>
			</div>
		);
	} else {
		switch (state) {
			default:
			case I.FileState.Error:
			case I.FileState.Empty: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="pdf" 
							textFile={translate('blockPdfUpload')}
							accept={J.Constant.fileExtension.pdf} 
							onChangeUrl={onChangeUrl} 
							onChangeFile={onChangeFile} 
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
				if (pages > 1) {
					pager = (
						<Pager 
							offset={page - 1} 
							limit={1} 
							total={pages} 
							pageLimit={1}
							isShort={true}
							onChange={setPage} 
						/>
					);
				};

				element = (
					<div ref={wrapRef} className={[ 'wrap', 'pdfWrapper', (pager ? 'withPager' : '') ].join(' ')} style={css}>
						<div className="info" onMouseDown={onOpenObject}>
							<ObjectName object={object} />
							<span className="size">{U.File.size(object.sizeInBytes)}</span>
						</div>

						<MediaPdf 
							id={`pdf-block-${id}`}
							ref={mediaRef}
							src={S.Common.fileUrl(targetObjectId)}
							page={page}
							onDocumentLoad={onDocumentLoad}
							onPageRender={onPageRender}
							onClick={onOpenFile}
						/>

						{pager}

						<Icon className="resize" onMouseDown={e => onResizeStart(e, false)} />
					</div>
				);
				break;
			};
		};
	};
	
	return (
		<div 
			ref={nodeRef}
			className={[ 'focusable', 'c' + id ].join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{element}
		</div>
	);

}));

export default BlockPdf;
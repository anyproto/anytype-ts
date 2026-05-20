import React, { Suspense, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import raf from 'raf';
import { MediaPlaceholder, Error, Pager, Icon, Loader, ObjectName, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const MediaPdf = React.lazy(() => import('Component/util/media/pdf'));

const BlockPdf = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
	const [ pages, setPages ] = useState(0);
	const [ page, setPage ] = useState(1);
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
		const el = U.Dom.get(`selectionTarget-${id}`);

		if (!el) {
			return width;
		};

		const ew = U.Dom.contentWidth(el);
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const onKeyDownHandler = (e: any) => {
		onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
	};
	
	const onKeyUpHandler = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
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
				type: I.FileType.Pdf,
			},
		});
	};

	const onDocumentLoad = (result: any) => {
		setPages(result.numPages);
	};

	const onPageRender = () => {
		heightRef.current = wrapRef.current?.offsetHeight ?? 0;
	};

	const isDownloading = S.Common.isDownloading(targetObjectId);

	const onOpenFile = () => {
		Action.openFile(object, analytics.route.block);
	};

	const onOpenObject = (e: any) => {
		if (!keyboard.withCommand(e)) {
			U.Object.openConfig(e, { id: block.getTargetObjectId(), layout: I.ObjectLayout.Pdf });
		};
	};

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const onResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		selection?.hide();
		U.Dom.addClass(nodeRef.current, 'isResizing');
		keyboard.setResize(true);
		keyboard.disableSelection(true);

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
		mediaRef.current?.resize();
	};

	const onResizeEnd = (e: any, checkMax: boolean) => {
		if (!wrapRef.current) {
			return;
		};

		const rect = U.Dom.getElementRect(wrapRef.current);
		const w = U.Common.snapWidth(getWidth(checkMax, e.pageX - rect.x + 20));

		U.Dom.removeClass(nodeRef.current, 'isResizing');

		if (mouseMoveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandler.current);
			mouseMoveHandler.current = null;
		};
		if (mouseUpHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandler.current);
			mouseUpHandler.current = null;
		};

		keyboard.disableSelection(false);
		keyboard.setResize(false);

		heightRef.current = 0;

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, width: w } },
		]);
	};

	const resize = () => {
		mediaRef.current?.resize();
	};

	useEffect(() => {
		resize();

		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	useImperativeHandle(ref, () => ({}));

	const typeName = translate('blockNamePdf');
	const overlay = <MediaState object={object} rootId={rootId} typeName={typeName} />;

	let element = null;
	let pager = null;

	if (object.isArchived && (state == I.FileState.Done)) {
		element = (
			<div ref={wrapRef} className={[ 'wrap', 'pdfWrapper' ].join(' ')} style={css}>
				<Suspense fallback={<Loader />}>
					<MediaPdf
						ref={mediaRef}
						src={S.Common.fileUrl(targetObjectId)}
						page={1}
						onDocumentLoad={onDocumentLoad}
						onPageRender={onPageRender}
						onClick={() => {}}
					/>
				</Suspense>
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
							iconParam={{ name: 'menu/block/media/pdf' }}
							text={translate('blockPdfAdd')}
							onClick={onPlaceholderClick}
							readonly={readonly}
						/>
					</>
				);
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

				const cn = [ 'wrap', 'pdfWrapper' ];
				if (pager) {
					cn.push('withPager');
				};

				element = (
					<div ref={wrapRef} className={cn.join(' ')} style={css}>
						<div className={[ 'info', (isDownloading ? 'isDownloading' : '') ].join(' ')} onMouseDown={onOpenObject}>
							{isDownloading ? <Icon className="downloading" /> : ''}
							<ObjectName object={object} />
							<span className="size">{U.File.size(object.sizeInBytes)}</span>
						</div>

						<Suspense fallback={<Loader />}>
							<MediaPdf
								ref={mediaRef}
								src={S.Common.fileUrl(targetObjectId)}
								page={page}
								onDocumentLoad={onDocumentLoad}
								onPageRender={onPageRender}
								onClick={onOpenFile}
							/>
						</Suspense>

						{pager}

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
			className={[ 'focusable', `c${id}` ].join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			{element}
		</div>
	);

});

export default BlockPdf;
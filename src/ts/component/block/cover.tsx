import React, { forwardRef, useRef, useState, useEffect, MouseEvent } from 'react';
import { Icon, DragHorizontal, Cover, Loader, Label } from 'Component';
import ControlButtons from 'Component/page/elements/head/controlButtons';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockCover = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
	const { rootId, block, readonly, isPopup } = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const object = S.Detail.get(rootId, rootId, [ 'iconImage', 'iconEmoji' ].concat(J.Relation.cover), true);
	const { coverType, coverId } = object;
	const isImage = U.Data.coverIsImage(coverType);
	const root = S.Block.getLeaf(rootId, rootId);
	const cn = [ 'elements', 'editorControlElements' ];
	const nodeRef = useRef(null);
	const elementsRef = useRef(null);
	const coverRef = useRef(null);
	const loaderRef = useRef(null);
	const dragRef = useRef(null);
	const resizeHandlerRef = useRef<(() => void) | null>(null);
	const mouseMoveHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
	const mouseUpHandlerRef = useRef<((e: globalThis.MouseEvent) => void) | null>(null);
	const loadedRef = useRef(false);
	const rectRef = useRef(null);
	const x = useRef(0);
	const y = useRef(0);
	const cx = useRef(0);
	const cy = useRef(0);
	const scale = useRef(0);
	const coords = useRef({ x: 0, y: 0 });

	useEffect(() => {
		resize();

		if (nodeRef.current) {
			U.Dom.renderLinks(nodeRef.current);
		};

		resizeHandlerRef.current = () => resize();
		U.Dom.addEvent(window, 'resize', resizeHandlerRef.current);

		return () => {
			if (resizeHandlerRef.current) {
				U.Dom.removeEvent(window, 'resize', resizeHandlerRef.current);
			};
			if (mouseMoveHandlerRef.current) {
				U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
			};
			if (mouseUpHandlerRef.current) {
				U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			};
		};
	}, []);
	
	useEffect(() => {
		resize();

		if (nodeRef.current) {
			U.Dom.renderLinks(nodeRef.current);
		};
	}, [ coverType, coverId ]);
	
	const onIcon = (e: any) => {
		const object = S.Detail.get(rootId, rootId, []);
		const cb = () => S.Menu.update('smile', { element: `#block-icon-${rootId}` });

		focus.clear(true);

		S.Menu.open('smile', {
			element: `#block-${U.Common.esc(block.id)} #button-icon`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Center,
			onOpen: () => U.Dom.addClass(elementsRef.current, 'hover'),
			onClose: () => U.Dom.removeClass(elementsRef.current, 'hover'),
			data: {
				objectId: rootId,
				value: (object.iconEmoji || object.iconImage || ''),
				onSelect: (icon: string) => U.Object.setIcon(rootId, icon, '', cb),
				onUpload: (objectId: string) => U.Object.setIcon(rootId, '', objectId, cb),
				route: analytics.route.icon,
			},
		});
	};
	
	const onLayout = () => {
		S.Menu.open('blockLayout', { 
			element: `#block-${U.Common.esc(block.id)} #button-layout`,
			classNameWrap: 'fromBlock',
			onOpen: () => U.Dom.addClass(elementsRef.current, 'hover'),
			onClose: () => U.Dom.removeClass(elementsRef.current, 'hover'),
			subIds: J.Menu.layout,
			data: {
				rootId,
				isPopup,
			}
		});
	};

	const onCoverOpen = () => {
		U.Dom.addClass(elementsRef.current, 'hover');
		focus.clear(true);
	};

	const onCoverClose = () => {
		U.Dom.removeClass(elementsRef.current, 'hover');
	};

	const onCoverSelect = (item: any) => {
		loadedRef.current = false;
		U.Object.setCover(rootId, item.type, item.itemId, item.coverX, item.coverY, item.coverScale);
	};
	
	const onEdit = (e: any) => {
		const { rootId } = props;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		coords.current.x = object.coverX;
		coords.current.y = object.coverY;
		scale.current = object.coverScale;
		setIsEditing(true);
	};

	const setLoading = (v: boolean) => {
		if (loaderRef.current) {
			U.Dom.css(loaderRef.current, { display: v ? '' : 'none' });
		};
	};
	
	const onUploadStart = () => {
		setLoading(true);
	};
	
	const onUpload = (type: I.CoverType, objectId: string) => {
		const { rootId } = props;

		coords.current.x = 0;
		coords.current.y = 0;
		scale.current = 0;

		U.Object.setCover(rootId, type, objectId, coords.current.x, coords.current.y, scale.current, () => {
			loadedRef.current = false;
			setLoading(false);
		});
	};
	
	const onSave = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);

		U.Object.setCover(rootId, object.coverType, object.coverId, coords.current.x, coords.current.y, scale.current, () => {
			setIsEditing(false);
		});
	};
	
	const onCancel = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		setIsEditing(false);
	};
	
	const resize = () => {
		const { rootId } = props;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);
		const { coverId, coverType } = object;
		const node = nodeRef.current;
		const cover = coverRef.current as HTMLImageElement;
		const isImage = U.Data.coverIsImage(coverType);

		if (!isImage || !node || !U.Dom.hasClass(node, 'wrap')) {
			return;
		};

		if (!cover) {
			return;
		};

		const cb = () => {
			const object = S.Detail.get(rootId, rootId, [ 'coverScale' ], true);

			rectRef.current = U.Dom.getElementRect(node);
			onScaleMove(null, object.coverScale);
			U.Dom.css(cover, { opacity: '1' });
			dragRef.current?.setValue(object.coverScale);

			if (!loadedRef.current) {
				setLoading(false);
			};
			loadedRef.current = true;
		};

		if (loadedRef.current) {
			cb();
		} else {
			U.Dom.css(cover, { opacity: '0' });
			setLoading(true);

			cover.onload = cb;
			cover.onerror = cb;
		};

		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType)) {
			cover.src = S.Common.imageUrl(coverId, I.ImageSize.Large);
		};
	};
	
	const onDragStart = (e: MouseEvent<HTMLDivElement>) => {
		e.preventDefault();

		if (!isEditing || !rectRef.current) {
			return false;
		};

		const node = nodeRef.current;

		x.current = e.pageX - rectRef.current.x - x.current;
		y.current = e.pageY - rectRef.current.y - y.current;
		onDragMove(e.pageX, e.pageY);

		keyboard.disableSelection(true);
		U.Dom.addClass(node, 'isDragging');

		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
		};

		mouseMoveHandlerRef.current = (e: globalThis.MouseEvent) => onDragMove(e.pageX, e.pageY);
		mouseUpHandlerRef.current = (e: globalThis.MouseEvent) => onDragEnd(e.pageX, e.pageY);

		U.Dom.addEvents(window, [
			['mousemove', mouseMoveHandlerRef.current],
			['mouseup', mouseUpHandlerRef.current],
		]);
	};

	const onDragMove = (pageX: number, pageY: number) => {
		if (!rectRef.current) {
			return false;
		};

		const { x: newX, y: newY } = setTransform(pageX - rectRef.current.x - x.current, pageY - rectRef.current.y - y.current);
		cx.current = newX;
		cy.current = newY;
	};

	const onDragEnd = (pageX: number, pageY: number) => {
		const node = nodeRef.current;
		const rect = rectRef.current;

		keyboard.disableSelection(false);

		if (mouseMoveHandlerRef.current) {
			U.Dom.removeEvent(window, 'mousemove', mouseMoveHandlerRef.current);
			mouseMoveHandlerRef.current = null;
		};
		if (mouseUpHandlerRef.current) {
			U.Dom.removeEvent(window, 'mouseup', mouseUpHandlerRef.current);
			mouseUpHandlerRef.current = null;
		};

		U.Dom.removeClass(node, 'isDragging');

		if (!rect) {
			return;
		};

		x.current = pageX - rect.x - x.current;
		y.current = pageY - rect.y - y.current;

		coords.current = { x: cx.current / rect.cw, y: cy.current / rect.ch };
	};
	
	const onScaleStart = (e: any, v: number) => {
		keyboard.disableSelection(true);
	};
	
	const onScaleMove = (e: any, v: number) => {
		const node = nodeRef.current;
		const cover = coverRef.current;
		const { rootId } = props;
		const object = S.Detail.get(rootId, rootId, [ 'coverX', 'coverY' ], true);
		const { coverX, coverY } = object;
		const value = node ? U.Dom.select('#dragValue', node) : null;

		if (!cover) {
			return;
		};

		v = (v + 1) * 100;

		U.Dom.css(cover, { height: 'auto', width: v + '%' });

		let rect = U.Dom.getElementRect(cover);

		// Ensure image covers container height
		if (rectRef.current && (rect.height < rectRef.current.height)) {
			const ratio = rectRef.current.height / rect.height;
			v = v * ratio;
			U.Dom.css(cover, { width: v + '%' });
			rect = U.Dom.getElementRect(cover);
		};

		if (value) {
			value.textContent = Math.ceil(v) + '%';
		};

		rectRef.current.cw = rect.width;
		rectRef.current.ch = rect.height;

		x.current = coverX * rect.width;
		y.current = coverY * rect.height;
		setTransform(x.current, y.current);
	};
	
	const onScaleEnd = (e: any, v: number) => {
		keyboard.disableSelection(false);
		scale.current = v;
	};

	const canDrop = (e: any) => {
		return !props.readonly && U.File.checkDropFiles(e);
	};
	
	const onDragOver = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		U.Dom.addClass(nodeRef.current, 'isDraggingOver');
	};

	const onDragLeave = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		U.Dom.removeClass(nodeRef.current, 'isDraggingOver');
	};
	
	const onDrop = (e: any) => {
		if (!canDrop(e) || readonly) {
			return;
		};

		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);

		U.Dom.removeClass(nodeRef.current, 'isDraggingOver');
		keyboard.disableCommonDrop(true);
		setLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, false, '', I.ImageKind.Cover, rootId, 'coverId', (message: any) => {
			setLoading(false);
			keyboard.disableCommonDrop(false);

			if (message?.error?.code) {
				return;
			};

			loadedRef.current = false;
			U.Object.setCover(rootId, I.CoverType.Upload, message.objectId);
		});
	};
	
	const setTransform = (x: number, y: number) => {
		const rect = rectRef.current;
		const mx = rect.cw - rect.width;
		const my = rect.ch - rect.height;

		x = Math.max(-mx, Math.min(0, x));

		if (rect.ch <= rect.height) {
			y = 0;
		} else {
			y = Math.max(-my, Math.min(0, y));
		};

		const px = rect.cw > 0 ? Math.min(0, x / rect.cw * 100) : 0;
		const py = rect.ch > 0 ? Math.min(0, y / rect.ch * 100) : 0;

		U.Dom.css(coverRef.current, { transform: `translate3d(${px}%,${py}%,0px)` });

		return { x, y };
	};
	
	if (!root) {
		return null;
	};

	let image = null;
	let author = null;
	let elements = null;
	let content = null;

	if (coverType == I.CoverType.Source) {
		image = S.Detail.get(rootId, coverId, [ 'mediaArtistName', 'mediaArtistURL' ], true);
		author = (
			<Label 
				className="author" 
				text={U.String.sprintf(translate('unsplashString'), `<a href=${image.mediaArtistURL + J.Url.unsplash.utm}>${image.mediaArtistName}</a>`, `<a href=${J.Url.unsplash.site + J.Url.unsplash.utm}>Unsplash</a>`)}
			/>
		);
	};

	if (isImage) { 
		content = <img ref={coverRef} id="cover" src="" className={[ 'cover', `type${coverType}`, coverId ].join(' ')} />;
	} else {
		content = <Cover ref={coverRef} id={coverId} image={coverId} type={coverType} className={coverId} />;
	};

	if (isEditing) {
		cn.push('active');

		elements = (
			<>
				<div key="btn-drag" className="btn black drag withIcon">
					<Icon name="control/cover/drag" size={16} />
					<div className="txt">{translate('blockCoverDrag')}</div>
				</div>
				
				<div className="dragWrap">
					<DragHorizontal 
						ref={dragRef} 
						onStart={onScaleStart} 
						onMove={onScaleMove} 
						onEnd={onScaleEnd} 
					/>
					<div id="dragValue" className="number">100%</div>
				</div>
				
				<div className="controlButtons">
					<div className="btn white" onMouseDown={onSave}>{translate('commonSave')}</div>
					<div className="btn white" onMouseDown={onCancel}>{translate('commonCancel')}</div>
				</div>
			</>
		);
	} else {
		elements = (
			<ControlButtons 
				rootId={rootId} 
				readonly={readonly}
				onIcon={onIcon} 
				onCoverOpen={onCoverOpen}
				onCoverClose={onCoverClose}
				onCoverSelect={onCoverSelect}
				onLayout={onLayout}
				onEdit={onEdit}
				onUploadStart={onUploadStart}
				onUpload={onUpload}
			/>
		);
	};

	return (
		<div 
			ref={nodeRef}
			className={[ 'wrap', (isEditing ? 'isEditing' : '') ].join(' ')} 
			onMouseDown={onDragStart} 
			onDragOver={onDragOver} 
			onDragLeave={onDragLeave} 
			onDrop={onDrop}
		>
			<Loader ref={loaderRef} />
			{content}
			{author}

			<div ref={elementsRef} id="elements" className={cn.join(' ')}>
				{elements}
			</div>
		</div>
	);
	
});

export default BlockCover;
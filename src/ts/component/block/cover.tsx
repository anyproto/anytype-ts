import React, { forwardRef, useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, DragHorizontal, Cover, Loader, Label } from 'Component';
import { I, C, S, U, J, focus, translate, keyboard, analytics } from 'Lib';
import ControlButtons from 'Component/page/elements/head/controlButtons';

const BlockCover = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	
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
			U.Common.renderLinks($(nodeRef.current));
		};
		$(window).off('resize.cover').on('resize.cover', () => resize());

		return () => {
			$(window).off('resize.cover');
		};
	}, []);
	
	useEffect(() => {
		resize();

		if (nodeRef.current) {
			U.Common.renderLinks($(nodeRef.current));
		};
	}, [ coverType, coverId ]);
	
	const onIcon = (e: any) => {
		const object = S.Detail.get(rootId, rootId, []);
		const cb = () => S.Menu.update('smile', { element: `#block-icon-${rootId}` });

		focus.clear(true);

		S.Menu.open('smile', { 
			element: `#block-${block.id} #button-icon`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Center,
			onOpen: () => $(elementsRef.current).addClass('hover'),
			onClose: () => $(elementsRef.current).removeClass('hover'),
			data: {
				value: (object.iconEmoji || object.iconImage || ''),
				onSelect: (icon: string) => U.Object.setIcon(rootId, icon, '', cb),
				onUpload: (objectId: string) => U.Object.setIcon(rootId, '', objectId, cb),
				route: analytics.route.icon,
			},
		});
	};
	
	const onLayout = () => {
		S.Menu.open('blockLayout', { 
			element: `#block-${block.id} #button-layout`,
			classNameWrap: 'fromBlock',
			onOpen: () => $(elementsRef.current).addClass('hover'),
			onClose: () => $(elementsRef.current).removeClass('hover'),
			subIds: J.Menu.layout,
			data: {
				rootId,
				isPopup,
			}
		});
	};

	const onCoverOpen = () => {
		$(elementsRef.current).addClass('hover');
		focus.clear(true);
	};

	const onCoverClose = () => {
		$(elementsRef.current).removeClass('hover');
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
		const loader = $(loaderRef.current);

		v ? loader.show() : loader.hide();
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
		const node = $(nodeRef.current);
		const cover = $(coverRef.current);
		const isImage = U.Data.coverIsImage(coverType);
		
		if (!isImage || !node.hasClass('wrap')) {
			return;
		};
		
		const el = cover.get(0) as HTMLImageElement;
		if (!el) {
			return;
		};

		const cb = () => {
			const object = S.Detail.get(rootId, rootId, [ 'coverScale' ], true);

			rectRef.current = (node.get(0) as Element).getBoundingClientRect();
			onScaleMove($.Event('resize'), object.coverScale);
			cover.css({ opacity: 1 });
			dragRef.current?.setValue(object.coverScale);

			if (!loadedRef.current) {
				setLoading(false);
			};
			loadedRef.current = true;
		};

		if (loadedRef.current) {
			cb();
		} else {
			cover.css({ opacity: 0 });
			setLoading(true);

			el.onload = cb;
			el.onerror = cb;
		};

		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType)) {
			el.src = S.Common.imageUrl(coverId, I.ImageSize.Large);
		};
	};
	
	const onDragStart = (e: any) => {
		e.preventDefault();
		
		if (!isEditing) {
			return false;
		};
		
		const win = $(window);
		const node = $(nodeRef.current);
		
		x.current = e.pageX - rectRef.current.x - x.current;
		y.current = e.pageY - rectRef.current.y - y.current;
		onDragMove(e);

		keyboard.disableSelection(true);
		node.addClass('isDragging');
		
		win.off('mousemove.cover mouseup.cover');
		win.on('mousemove.cover', e => onDragMove(e));
		win.on('mouseup.cover', e => onDragEnd(e));
	};
	
	const onDragMove = (e: any) => {
		if (!rectRef.current) {
			return false;
		};
		
		const { x: newX, y: newY } = setTransform(e.pageX - rectRef.current.x - x.current, e.pageY - rectRef.current.y - y.current);
		cx.current = newX;
		cy.current = newY;
	};
	
	const onDragEnd = (e: any) => {
		const win = $(window);
		const node = $(nodeRef.current);
		const rect = rectRef.current;
		
		keyboard.disableSelection(false);
		win.off('mousemove.cover mouseup.cover');
		node.removeClass('isDragging');
		
		x.current = e.pageX - rect.x - x.current;
		y.current = e.pageY - rect.y - y.current;

		coords.current = { x: cx.current / rect.cw, y: cy.current / rect.ch };
	};
	
	const onScaleStart = (e: any, v: number) => {
		keyboard.disableSelection(true);
	};
	
	const onScaleMove = (e: any, v: number) => {
		const node = $(nodeRef.current);
		const cover = $(coverRef.current);
		const { rootId } = props;
		const object = S.Detail.get(rootId, rootId, [ 'coverX', 'coverY' ], true);
		const { coverX, coverY } = object;
		const value = node.find('#dragValue');

		v = (v + 1) * 100;
		value.text(Math.ceil(v) + '%');
		cover.css({ height: 'auto', width: v + '%' });

		const el = cover.get(0);
		if (!el) {
			return;
		};

		const rect = el.getBoundingClientRect() as DOMRect;

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

		$(nodeRef.current).addClass('isDraggingOver');
	};
	
	const onDragLeave = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		$(nodeRef.current).removeClass('isDraggingOver');
	};
	
	const onDrop = (e: any) => {
		if (!canDrop(e) || readonly) {
			return;
		};

		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(nodeRef.current);
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		setLoading(true);
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, false, '', I.ImageKind.Cover, (message: any) => {
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
		y = Math.max(-my, Math.min(0, y));

		const px = Math.min(0, x / rect.cw * 100);
		const py = Math.min(0, y / rect.ch * 100);
		const css: any = { transform: `translate3d(${px}%,${py}%,0px)` };

		if (rect.ch < rect.height) {
			css.transform = 'translate3d(0px,0px,0px)';
			css.height = rect.height;
			css.width = 'auto';
		};

		$(coverRef.current).css(css);

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
					<Icon />
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
	
}));

export default BlockCover;
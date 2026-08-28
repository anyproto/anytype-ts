import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { MediaPlaceholder, Icon, Error, Loader, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockImage = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { width } = block.fields || {};
	const { state } = block.content;
	const targetObjectId = block.getTargetObjectId();
	const nodeRef = useRef(null);
	const wrapRef = useRef<HTMLDivElement | null>(null);
	const imgRef = useRef<HTMLImageElement | null>(null);
	
	const [ isLoaded, setIsLoaded ] = useState(false);
	const [ isBroken, setIsBroken ] = useState(false);
	const [ retryKey, setRetryKey ] = useState(0);
	const retryCountRef = useRef(0);
	const retryTimerRef = useRef<any>(null);

	const isDownloading = S.Common.isDownloading(targetObjectId);

	const clearRetryTimer = () => {
		if (retryTimerRef.current) {
			clearTimeout(retryTimerRef.current);
			retryTimerRef.current = null;
		}
	};

	// Reset state and attempt preloading when targetObjectId changes
	useEffect(() => {
		clearRetryTimer();
		setIsLoaded(false);
		setIsBroken(false);
		setRetryKey(0);
		retryCountRef.current = 0;
		if (wrapRef.current) {
			U.Dom.removeClass(wrapRef.current, 'brokenMedia');
		}

		if (targetObjectId) {
			const url = S.Common.imageUrl(targetObjectId, I.ImageSize.Large);
			if (url && typeof U !== 'undefined' && U.ImageCache) {
				U.ImageCache.preload(url).then(() => {
					setIsLoaded(true);
				}).catch(() => {});
			}
		}

		return () => {
			clearRetryTimer();
		};
	}, [targetObjectId]);

	// Fast detection if image was already in browser cache or completed
	useEffect(() => {
		if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
			setIsLoaded(true);
			setIsBroken(false);
		}
	});

	// When download completes in background, immediately retry loading
	useEffect(() => {
		if (!isDownloading && isBroken) {
			setIsBroken(false);
			retryCountRef.current = 0;
			if (wrapRef.current) {
				U.Dom.removeClass(wrapRef.current, 'brokenMedia');
			}
			setRetryKey(k => k + 1);
		}
	}, [isDownloading, isBroken]);

	const handleImageError = useCallback(() => {
		clearRetryTimer();

		// Invalidate memory cache so retry requests fresh data from gateway
		const baseImgUrl = S.Common.imageUrl(targetObjectId, I.ImageSize.Large);
		if (typeof U !== 'undefined' && U.ImageCache?.invalidate) {
			U.ImageCache.invalidate(baseImgUrl);
		}

		// Quick auto-retry for in-flight P2P chunk sync
		const maxRetries = (typeof U !== 'undefined' && U.Common?.getMaxImageRetries) ? U.Common.getMaxImageRetries() : 2;
		if (retryCountRef.current < maxRetries || isDownloading) {
			retryCountRef.current++;
			const delay = retryCountRef.current === 1 ? 500 : 1200;
			retryTimerRef.current = setTimeout(() => {
				setRetryKey(k => k + 1);
			}, delay);
		} else {
			setIsBroken(true);
			setIsLoaded(false);
			if (wrapRef.current) {
				U.Dom.addClass(wrapRef.current, 'brokenMedia');
			}
		}
	}, [targetObjectId, isDownloading]);

	const handleImageLoad = useCallback(() => {
		clearRetryTimer();
		retryCountRef.current = 0;
		setIsBroken(false);
		setIsLoaded(true);
		if (wrapRef.current) {
			U.Dom.removeClass(wrapRef.current, 'brokenMedia');
		}
	}, []);

	const handleKeyDown = (e: any) => {
		onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const handleKeyUp = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const handleFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	const handlePlaceholderClick = (e: any) => {
		e.stopPropagation();

		S.Menu.open('blockMedia', {
			element: `#block-${block.id}`,
			data: {
				rootId,
				blockId: block.id,
				type: I.FileType.Image,
			},
		});
	};

	const mouseMoveHandler = useRef<((e: any) => void) | null>(null);
	const mouseUpHandler = useRef<((e: any) => void) | null>(null);

	const handleResizeStart = (e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

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

	const handleClick = (e: any) => {
		if (isBroken) {
			// Click on broken image triggers immediate reload
			e.stopPropagation();
			setIsBroken(false);
			setIsLoaded(false);
			retryCountRef.current = 0;
			handleDownload();
			setRetryKey(k => k + 1);
			return;
		}

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

	const handleDownload = () => {
		Action.downloadFile(targetObjectId, analytics.route.block, block.isFileImage());
	};

	const getWidth = (checkMax: boolean, v: number): number => {
		const el = U.Dom.get(`selectionTarget-${block.id}`);
		const width = Number(block.fields.width) || 1;

		if (!el) {
			return width;
		};

		const ew = U.Dom.contentWidth(el);
		const w = Math.min(ew, Math.max(ew / 12, checkMax ? width * ew : v));

		return Math.min(1, Math.max(0, w / ew));
	};

	const object = S.Detail.get(rootId, targetObjectId, [ 'widthInPixels', 'heightInPixels' ]);
	const cn = [ 'focusable', `c${block.id}` ];
	const css: any = {};
	const wrapCss: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	if (object.widthInPixels && object.heightInPixels) {
		wrapCss.aspectRatio = `${object.widthInPixels} / ${object.heightInPixels}`;
		if (!width) {
			wrapCss.width = object.widthInPixels;
		};
	} else
	if (!isLoaded) {
		wrapCss.height = 80;
	};

	const typeName = translate('blockNameImage');
	const overlay = <MediaState object={object} rootId={rootId} typeName={typeName} />;

	// Build image URL with retry query param for cache-busting on retry
	const rawUrl = S.Common.imageUrl(targetObjectId, I.ImageSize.Large);
	const finalSrc = rawUrl ? (retryKey > 0 ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}retry=${retryKey}` : rawUrl) : '';

	let element = null;

	if (object.isArchived && (state == I.FileState.Done)) {
		element = (
			<div ref={wrapRef} className={['wrap', isBroken ? 'brokenMedia' : ''].join(' ')} style={{ ...css, ...wrapCss }}>
				{!isLoaded && !isBroken ? <Loader type={I.LoaderType.Loader} /> : ''}
				<img
					ref={imgRef}
					className="mediaImage"
					src={finalSrc}
					onDragStart={e => e.preventDefault()}
					onLoad={handleImageLoad}
					onError={handleImageError}
				/>
				{overlay}
			</div>
		);
	} else
	if (object.isDeleted || object.isArchived) {
		element = overlay;
	} else {
		switch (state) {
			default: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<MediaPlaceholder
							iconParam={{ name: 'menu/block/media/image' }}
							text={translate('blockImageAdd')}
							onClick={handlePlaceholderClick}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.FileState.Done: {
				element = (
					<div ref={wrapRef} className={['wrap', isBroken ? 'brokenMedia' : ''].join(' ')} style={{ ...css, ...wrapCss }}>
						{!isLoaded && !isBroken ? <Loader type={I.LoaderType.Loader} /> : ''}
						<img
							ref={imgRef}
							className="mediaImage"
							src={finalSrc}
							onDragStart={e => e.preventDefault()}
							onClick={handleClick}
							onLoad={handleImageLoad}
							onError={handleImageError}
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

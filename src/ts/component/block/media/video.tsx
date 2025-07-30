import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Icon, Loader, Error, MediaVideo } from 'Component';
import { I, C, S, J, translate, focus, Action, keyboard } from 'Lib';

const BlockVideo = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const isMountedRef = useRef(false);
	const nodeRef = useRef<any>(null);
	const divRef = useRef(0);
	const speedRef = useRef(1);

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { id, fields, content } = block;
	const { state, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const { width } = fields;
	const css: any = {};

	if (width) {
		css.width = (width * 100) + '%';
	};

	const getWidth = useCallback((checkMax: boolean, v: number): number => {
		const width = Number(fields.width) || 1;
		const el = $(`#selectionTarget-${id}`);

		if (!el.length) {
			return width;
		};
		
		const rect = el.get(0).getBoundingClientRect() as DOMRect;
		const w = Math.min(rect.width, Math.max(160, checkMax ? width * rect.width : v));
		
		return Math.min(1, Math.max(0, w / rect.width));
	}, [ fields.width, id ]);

	const onPlay = useCallback(() => {
		$(nodeRef.current).addClass('isPlaying');
	}, []);

	const onPause = useCallback(() => {
		$(nodeRef.current).removeClass('isPlaying');
	}, []);

	const onKeyDownHandler = useCallback((e: any) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	}, [ onKeyDown, props ]);
	
	const onKeyUpHandler = useCallback((e: any) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
	}, [ onKeyUp, props ]);

	const onFocus = useCallback(() => {
		focus.set(block.id, { from: 0, to: 0 });
	}, [ block.id ]);
	
	const onChangeUrl = useCallback((e: any, url: string) => {
		Action.upload(I.FileType.Video, rootId, id, url, '');
	}, [ rootId, id ]);
	
	const onChangeFile = useCallback((e: any, path: string) => {
		Action.upload(I.FileType.Video, rootId, id, '', path);
	}, [ rootId, id ]);

	const onResizeInit = useCallback(() => {
		if (!isMountedRef.current) {
			return;
		};
		
		const node = $(nodeRef.current);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		wrap.css({ width: (getWidth(true, 0) * 100) + '%' });
	}, [ getWidth ]);

	const onResizeStart = useCallback((e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (!isMountedRef.current) {
			return;
		};
		
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		
		focus.set(block.id, { from: 0, to: 0 });
		win.off('mousemove.media mouseup.media');
		
		selection?.hide();

		keyboard.setResize(true);
		keyboard.disableSelection(true);
		$(`#block-${block.id}`).addClass('isResizing');
		win.on('mousemove.media', e => onResizeMove(e, checkMax));
		win.on('mouseup.media', e => onResizeEnd(e, checkMax));
	}, [ block.id ]);
	
	const onResizeMove = useCallback((e: any, checkMax: boolean) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (!isMountedRef.current) {
			return;
		};
		
		const node = $(nodeRef.current);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = getWidth(checkMax, e.pageX - rect.x + 20);
		
		wrap.css({ width: (w * 100) + '%' });
	}, [ getWidth ]);
	
	const onResizeEnd = useCallback((e: any, checkMax: boolean) => {
		if (!isMountedRef.current) {
			return;
		};
		
		const node = $(nodeRef.current);
		const wrap = node.find('.wrap');
		
		if (!wrap.length) {
			return;
		};
		
		const win = $(window);
		const rect = (wrap.get(0) as Element).getBoundingClientRect() as DOMRect;
		const w = getWidth(checkMax, e.pageX - rect.x + 20);
		
		win.off('mousemove.media mouseup.media');
		$(`#block-${block.id}`).removeClass('isResizing');
		keyboard.disableSelection(false);
		keyboard.setResize(false);
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width: w } },
		]);
	}, [ rootId, id, block.id, getWidth ]);

	const initVideo = useCallback(() => {
		const node = $(nodeRef.current);
		const video = node.find('video');

		if (!video.length) {
			return;
		};

		divRef.current = 16 / 9;
		onResizeInit();

		video.on('canplay', (e: any) => {
			const el = video.get(0);

			divRef.current = el.videoWidth / el.videoHeight;
			onResizeInit();
		});
	}, [ onResizeInit ]);
	
	const rebind = useCallback(() => {
		if (!isMountedRef.current) {
			return;
		};
		
		unbind();
		
		const node = $(nodeRef.current);
		node.on('resizeStart', (e: any, oe: any) => onResizeStart(oe, true));
		node.on('resizeMove', (e: any, oe: any) => onResizeMove(oe, true));
		node.on('resizeEnd', (e: any, oe: any) => onResizeEnd(oe, true));
		node.on('resizeInit', (e: any, oe: any) => onResizeInit());
	}, [ onResizeStart, onResizeMove, onResizeEnd, onResizeInit ]);
	
	const unbind = useCallback(() => {
		if (!isMountedRef.current) {
			return;
		};
		
		const node = $(nodeRef.current);
		const video = node.find('video');
		
		node.off('resizeInit resizeStart resizeMove resizeEnd');
		video.off('canplay');
	}, []);

	useEffect(() => {
		isMountedRef.current = true;
		rebind();
		initVideo();

		return () => {
			isMountedRef.current = false;
			unbind();
		};
	}, [ rebind, initVideo, unbind ]);
	
	useEffect(() => {
		rebind();
	});

	useImperativeHandle(ref, () => ({}));

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
			default:
			case I.FileState.Error:
			case I.FileState.Empty: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="video" 
							textFile={translate('blockVideoUpload')} 
							accept={J.Constant.fileExtension.video} 
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
				element = (
					<div className="wrap resizable" style={css}>
						<MediaVideo
							src={S.Common.fileUrl(targetObjectId)}
							onPlay={onPlay}
							onPause={onPause}
						/>
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

export default BlockVideo;
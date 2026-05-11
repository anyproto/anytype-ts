import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import raf from 'raf';
import { MediaPlaceholder, Error, MediaAudio, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockAudio = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const playerRef = useRef<any>(null);

	const { rootId, block, readonly, isPopup, onKeyDown, onKeyUp } = props;
	const { id, content } = block;
	const { state, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'isArchived', 'fileExt' ], true);
	const { name } = object;

	const getPlaylist = () => {
		const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'isArchived', 'fileExt' ], true);

		return [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];
	};

	const onPlay = () => {
		U.Dom.addClass(nodeRef.current, 'isPlaying');
	};

	const onPause = () => {
		U.Dom.removeClass(nodeRef.current, 'isPlaying');
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			playerRef.current?.onPlay();
			ret = true;
		});

		if (ret) {
			return;
		};
		
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
			element: `#block-${block.id}`,
			data: {
				rootId,
				blockId: block.id,
				type: I.FileType.Audio,
			},
		});
	};

	const resize = () => {
		playerRef.current?.resize?.();
	};

	useEffect(() => {
		resize();

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

	useEffect(() => {
		playerRef.current?.updatePlaylist(getPlaylist());
	});

	useImperativeHandle(ref, () => ({}));
	
	let element = null;
	const typeName = translate('blockNameAudio');

	if (object.isDeleted || object.isArchived) {
		element = <MediaState object={object} rootId={rootId} typeName={typeName} />;
	} else {
		switch (state) {
			default:
			case I.FileState.Error:
			case I.FileState.Empty: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<MediaPlaceholder
							iconParam={{ name: 'menu/block/media/audio' }}
							text={translate('blockAudioAdd')}
							onClick={onPlaceholderClick}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.FileState.Done: {
				element = (
					<MediaAudio
						ref={playerRef}
						playlist={getPlaylist()}
						onPlay={onPlay}
						onPause={onPause}
						getScrollContainer={() => U.Dom.getScrollContainer(isPopup)}
					/>
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

export default BlockAudio;
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, Loader, Error, MediaAudio, Icon } from 'Component';
import { I, S, J, U, translate, focus, keyboard, Action } from 'Lib';

const BlockAudio = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const refPlayerRef = useRef<any>(null);

	const { rootId, block, readonly, isPopup, onKeyDown, onKeyUp } = props;
	const { id, content } = block;
	const { state, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'fileExt' ], true);
	const { name } = object;

	const getPlaylist = () => {
		const object = S.Detail.get(rootId, targetObjectId, [ 'name', 'isDeleted', 'fileExt' ], true);

		return [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];
	};

	const onPlay = () => {
		$(nodeRef.current).addClass('isPlaying');
	};

	const onPause = () => {
		$(nodeRef.current).removeClass('isPlaying');
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			refPlayerRef.current?.onPlay();
			ret = true;
		});

		if (ret) {
			return;
		};
		
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
		Action.upload(I.FileType.Audio, rootId, block.id, url, '');
	};
	
	const onChangeFile = (e: any, path: string) => {
		Action.upload(I.FileType.Audio, rootId, block.id, '', path);
	};

	const rebind = () => {
		$(nodeRef.current).on('resize', () => {
			refPlayerRef.current?.resize();
		});
	};

	const unbind = () => {
		$(nodeRef.current).off('resize');
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, [ rebind, unbind ]);

	useEffect(() => {
		rebind();
		refPlayerRef.current?.updatePlaylist(getPlaylist());
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
							icon="audio" 
							textFile={translate('blockAudioUpload')} 
							accept={J.Constant.fileExtension.audio} 
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
					<MediaAudio
						ref={refPlayerRef}
						playlist={getPlaylist()}
						onPlay={onPlay}
						onPause={onPause}
						getScrollContainer={() => U.Common.getScrollContainer(isPopup)}
					/>
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

export default BlockAudio;
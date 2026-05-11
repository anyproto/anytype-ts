import React, { forwardRef, KeyboardEvent } from 'react';
import { MediaPlaceholder, IconObject, Error, ObjectName, Icon, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockFile = forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { id, content } = block;
	const { state, style, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);
	const isDownloading = S.Common.isDownloading(targetObjectId);

	const onKeyDownHandler = (e: KeyboardEvent) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};
	
	const onKeyUpHandler = (e: KeyboardEvent) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		};
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
				type: I.FileType.File,
			},
		});
	};
	
	const onClick = (e: any) => {
		if (!e.button) {
			Action.openFile(object, analytics.route.block);
		};
	};

	let element = null;
	const typeName = translate('blockNameFile');

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
							iconParam={{ name: 'menu/block/media/file' }}
							text={translate('blockFileAdd')}
							onClick={onPlaceholderClick}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.FileState.Done: {
				element = (
					<div
						className={[ 'inner', (isDownloading ? 'isDownloading' : '') ].join(' ')}
						onMouseDown={onClick}
					>
						{isDownloading ? (
							<Icon className="downloading" />
						) : (
							<IconObject object={object} size={24} />
						)}
						<ObjectName object={object} />
						<span className="size">{U.File.size(object.sizeInBytes)}</span>
					</div>
				);
				break;
			};
		};
	};

	return (
		<div 
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

export default BlockFile;

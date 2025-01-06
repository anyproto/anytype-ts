import React, { forwardRef, KeyboardEvent } from 'react';
import { InputWithFile, Loader, IconObject, Error, ObjectName, Icon } from 'Component';
import { I, S, U, focus, translate, Action, analytics } from 'Lib';
import { observer } from 'mobx-react';

const BlockFile = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { id, content } = block;
	const { state, style, targetObjectId } = content;
	const object = S.Detail.get(rootId, targetObjectId, []);

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
	
	const onChangeUrl = (e: any, url: string) => {
		Action.upload(I.FileType.File, rootId, block.id, url, '');
	};
	
	const onChangeFile = (e: any, path: string) => {
		Action.upload(I.FileType.File, rootId, block.id, '', path);
	};
	
	const onClick = (e: any) => {
		if (!e.button) {
			Action.openFile(block.getTargetObjectId(), analytics.route.block);
		};
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
			default:
			case I.FileState.Error:
			case I.FileState.Empty: {
				element = (
					<>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="file" 
							textFile={translate('blockFileUpload')} 
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
					<div 
						className="inner" 
						onMouseDown={onClick} 
					>
						<IconObject object={object} size={24} />
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

}));

export default BlockFile;
import React, { forwardRef, useEffect, useRef, MouseEvent } from 'react';
import raf from 'raf';
import { InputWithFile, ObjectName, ObjectDescription, Loader, Error, MediaState } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockBookmark = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp, getWrapperWidth } = props;
	const { state, targetObjectId } = block.content;
	const nodeRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLAnchorElement>(null);
	const object = S.Detail.get(rootId, targetObjectId, [ 'picture', 'source' ]);
	const { iconImage, picture, isArchived, isDeleted } = object;
	const url = block.content.url || object.source;
	const cn = [ 'focusable', `c${block.id}` ];

	const onKeyDownHandler = (e: any) => {
		onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
	};
	
	const onKeyUpHandler = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const onFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	const onClick = (e: any) => {
		if (e.button) {
			return;
		};

		e.preventDefault();

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (
			((e.ctrlKey || e.metaKey) && (ids.length > 1)) || 
			keyboard.isSelectionClearDisabled
		) {
			return;
		};

		e.stopPropagation();
		open();
	};

	const onMouseEnter = (e: MouseEvent) => {
		if (!targetObjectId || object._empty_ || object.isArchived || object.isDeleted) {
			return;
		};

		Preview.previewShow({ 
			rect: { x: e.pageX, y: e.pageY, width: 0, height: 0 },
			object,
			target: targetObjectId, 
			noUnlink: true,
			noEdit: true,
			passThrough: true,
		});
	};

	const onMouseLeave = () => {
		Preview.previewHide(true);
	};

	const onMouseDown = (e: any) => {
		e.persist();

		if (keyboard.withCommand(e) || (e.button != 1)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		open();
	};

	const open = () => {
		Action.openUrl(url);
		analytics.event('BlockBookmarkOpenUrl');
	};
	
	const onChangeUrl = (e: any, url: string) => {
		const bookmark = S.Record.getBookmarkType();

		C.BlockBookmarkFetch(rootId, block.id, url, bookmark?.defaultTemplateId);
	};
	
	const resize = () => {
		window.setTimeout(() => {
			const inner = innerRef.current;
			if (inner) {
				U.Dom.toggleClass(inner, 'isVertical', inner.offsetWidth <= getWrapperWidth() / 2);
			};
		}, 0);
	};

	let element = null;
	const typeName = translate('blockNameBookmark');

	if (isDeleted || isArchived) {
		element = <MediaState object={object} rootId={rootId} typeName={typeName} />;
	} else {
		switch (state) {
			default:
			case I.BookmarkState.Error:
			case I.BookmarkState.Empty: {
				element = (
					<>
						{state == I.BookmarkState.Error ? <Error text={translate('blockBookmarkError')} /> : ''}
						<InputWithFile
							block={block}
							iconParam={{ name: 'menu/block/common/bookmark' }}
							textFile={translate('inputWithFileTextUrl')}
							withFile={false}
							onChangeUrl={onChangeUrl}
							readonly={readonly}
						/>
					</>
				);
				break;
			};

			case I.BookmarkState.Fetching: {
				element = <Loader />;
				break;
			};

			case I.BookmarkState.Done: {
				const cni = [ 'inner' ];
				const cnl = [ 'side', 'left' ];

				if (picture) {
					cni.push('withImage');
				};

				if (block.bgColor) {
					cni.push(`bgColor bgColor-${block.bgColor}`);
				};

				element = (
					<a
						href={url}
						ref={innerRef}
						className={cni.join(' ')}
						draggable={false}
						onDragStart={e => e.preventDefault()}
						onClick={onClick}
						onMouseDown={onMouseDown}
						{...U.Common.dataProps({ href: url })}
					>
						<div className={cnl.join(' ')}>
							<div className="link">
								{iconImage ? <img src={S.Common.imageUrl(iconImage, I.ImageSize.Small)} className="fav" /> : ''}
								{U.String.shortUrl(url)}
							</div>
							<ObjectName object={object} />
							<ObjectDescription object={object} />
						</div>
						<div className="side right">
							{picture ? <img src={S.Common.imageUrl(picture, I.ImageSize.Medium)} className="img" /> : ''}
						</div>
					</a>
				);
				break;
			};
		};
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

	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')} 
			tabIndex={0} 
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{element}
		</div>
	);

});

export default BlockBookmark;
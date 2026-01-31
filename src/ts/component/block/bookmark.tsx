import React, { forwardRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InputWithFile, ObjectName, ObjectDescription, Loader, Error, Icon } from 'Component';
import { I, C, S, U, focus, translate, analytics, Action, keyboard, Preview } from 'Lib';

const BlockBookmark = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, onKeyDown, onKeyUp, getWrapperWidth } = props;
	const { state, targetObjectId } = block.content;
	const nodeRef = React.useRef<HTMLDivElement>(null);
	const innerRef = React.useRef<HTMLAnchorElement>(null);
	const object = S.Detail.get(rootId, targetObjectId, [ 'picture', 'source' ]);
	const { iconImage, picture, isArchived, isDeleted } = object;
	const url = object.source || block.content.url;
	const cn = [ 'focusable', `c${block.id}`, 'resizable' ];

	const rebind = () => {
		unbind();
		$(nodeRef.current).on('resizeInit resizeMove', e => resize());
	};
	
	const unbind = () => {
		$(nodeRef.current).off('resizeInit resizeMove');
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

	const onClick = (e: any) => {
		if (e.button) {
			return;
		};

		e.preventDefault();

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (!(keyboard.withCommand(e) && ids.length)) {
			open();
		};
	};

	const onMouseEnter = (e: React.MouseEvent) => {
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

		if (keyboard.withCommand(e)) {
			return;
		};

		// middle mouse click
		if (e.button == 1) {
			e.preventDefault();
			e.stopPropagation();

			open();
		};
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
			const inner = $(innerRef.current);
			inner.toggleClass('isVertical', inner.width() <= getWrapperWidth() / 2);
		});
	};

	let element = null;

	if (isDeleted) {
		element = (
			<div className="deleted">
				<Icon className="ghost" />
				<div className="name">{translate('commonDeletedObject')}</div>
			</div>
		);
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
							icon="bookmark" 
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
				
				let archive = null;
					
				if (picture) {
					cni.push('withImage');
				};

				if (isArchived) {
					cni.push('isArchived');
				};

				if (block.bgColor) {
					cni.push(`bgColor bgColor-${block.bgColor}`);
				};

				if (isArchived) {
					archive = <div className="tagItem isMultiSelect archive">{translate('blockLinkArchived')}</div>;
				};

				element = (
					<a 
						href={url}
						ref={innerRef}
						className={cni.join(' ')} 
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

							{archive}
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
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();
	});

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

}));

export default BlockBookmark;
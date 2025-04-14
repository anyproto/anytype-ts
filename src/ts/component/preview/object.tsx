import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader, IconObject, Cover, Icon, ObjectName } from 'Component';
import { I, C, S, U, J, Action, translate } from 'Lib';

interface Props {
	rootId: string;
	size: I.PreviewSize;
	className?: string;
	onMore? (e: any): void;
	onClick? (e: any): void;
	onContextMenu? (e: any): void;
	onMouseEnter? (e: any): void;
	onMouseLeave? (e: any): void;
	position?: () => void;
	setObject?: (object: any) => void;
};

const Colors = [ 'yellow', 'red', 'ice', 'lime' ];

const PreviewObject = observer(forwardRef<{}, Props>(({
	rootId = '',
	size = I.PreviewSize.Small,
	className = '',
	onClick,
	onContextMenu,
	onMore,
	onMouseEnter,
	onMouseLeave,
	position,
	setObject,
}, ref: any) => {

	const nodeRef = useRef(null);
	const idRef = useRef('');
	const [ isLoading, setIsLoading ] = useState(false);

	let n = 0;
	let c = 0;
	let iconSize = 48;
	let cnPreviewSize = '';

	const Block = (item: any) => {
		const { content, fields } = item;
		const { text, style, checked, targetObjectId } = content;
		const childBlocks = S.Block.getChildren(contextId, item.id);
		const length = childBlocks.length;
		const cn = [ 'element', U.Data.blockClass(item), item.className ];

		let bullet = null;
		let inner = null;
		let isRow = false;
		let line = <div className="line" />;

		switch (item.type) {
			case I.BlockType.Text: {
				if (!text) {
					line = null;
				};

				if ([ I.TextStyle.Checkbox, I.TextStyle.Bulleted, I.TextStyle.Numbered, I.TextStyle.Quote ].indexOf(style) >= 0) {
					cn.push('withBullet');
				};

				switch (style) {
					default: {
						inner = line;
						break;
					};

					case I.TextStyle.Header1:
					case I.TextStyle.Header2:
					case I.TextStyle.Header3: {
						inner = text;
						break;
					};

					case I.TextStyle.Checkbox: {
						inner = (
							<>
								<Icon className={[ 'check', (checked ? 'active' : '') ].join(' ')} />
								{line}
							</>
						);
						break;
					};

					case I.TextStyle.Quote: {
						inner = (
							<>
								<Icon className="hl" />
								{line}
							</>
						);
						break;
					};

					case I.TextStyle.Bulleted: {
						inner = (
							<>
								<Icon className="bullet" />
								{line}
							</>
						);
						break;
					};

					case I.TextStyle.Toggle: {
						inner = (
							<>
								<Icon className="toggle" />
								{line}
							</>
						);
						break;
					};

					case I.TextStyle.Numbered: {
						inner = (
							<>
								<div id={'marker-' + item.id} className="number" />
								{line}
							</>
						);
						break;
					};
				};
				break;
			};

			case I.BlockType.Layout: {
				if (style == I.LayoutStyle.Row) {
					isRow = true;
				};
				break;
			};

			case I.BlockType.Relation: {
				inner = (
					<>
						{line}
						{line}
					</>
				);
				break;
			};

			case I.BlockType.File: {
				if ([ I.FileState.Empty, I.FileState.Error ].indexOf(content.state) >= 0) {
					break;
				};

				switch (content.type) {
					default:
					case I.FileType.File: {
						bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-' + Colors[c] ].join(' ')} />;
						inner = (
							<>
								<Icon className="color" inner={bullet} />
								{line}
							</>
						);

						c++;
						if (c > Colors.length - 1) {
							c = 0;
						};
						break;
					};

					case I.FileType.Image: {
						const css: any = {};

						if (fields.width) {
							css.width = (fields.width * 100) + '%';
						};

						inner = <img className="media" src={S.Common.imageUrl(targetObjectId, J.Size.image)} style={css} />;
						break;
					};

					case I.FileType.Video: {
						break;
					};

				};
				break;
			};

			case I.BlockType.Link: {
				bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-' + Colors[c] ].join(' ')} />;
				inner = (
					<>
						<Icon className="color" inner={bullet} />
						{line}
					</>
				);

				c++;
				if (c > Colors.length - 1) {
					c = 0;
				};
				break;
			};

			case I.BlockType.Bookmark: {
				if (!content.url) {
					break;
				};

				bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-grey' ].join(' ')} />;
				inner = (
					<div className="bookmark">
						<div className="side left">
							<div className="name">
								<div className="line odd" />
							</div>

							<div className="descr">
								<div className="line even" />
								<div className="line odd" />
							</div>

							<div className="url">
								<Icon className="color" inner={bullet} />
								<div className="line even" />
							</div>
						</div>
						<div className="side right" style={{ backgroundImage: `url("${S.Common.imageUrl(content.imageHash, 170)}")` }} />
					</div>
				);
				break;
			};
		};

		return (
			<div className={cn.join(' ')} style={item.css}>
				{inner ? (
					<div className="inner">
						{inner}
					</div>
				) : ''}

				{length ? (
					<div className="children">
						{childBlocks.map((child: any, i: number) => {
							const css: any = {};
							const cn = [ n % 2 == 0 ? 'even' : 'odd' ];

							if (i == 0) {
								cn.push('first');
							};

							if (i == childBlocks.length - 1) {
								cn.push('last');
							};

							if (isRow) {
								css.width = (child.fields.width || 1 / length ) * 100 + '%';
							};

							n++;
							n = checkNumber(child, n);
							return <Block key={child.id} {...child} className={cn.join(' ')} css={css} />;
						})}
					</div>
				) : ''}
			</div>
		);
	};

	const rebind = () => {
		unbind();
		$(window).on(`updatePreviewObject.${rootId}`, () => update());
	};

	const unbind = () => {
		$(window).off(`updatePreviewObject.${rootId}`);
	};

	const onMouseEnterHandler = (e: any) => {
		if (onMouseEnter) {
			onMouseEnter(e);
		};

		$(nodeRef.current).addClass('hover');
	};

	const onMouseLeaveHandler = (e: any) => {
		if (onMouseLeave) {
			onMouseLeave(e);
		};

		$(nodeRef.current).removeClass('hover');
	};

	const load = () => {
		const contextId = getRootId();

		if (isLoading || (idRef.current == rootId)) {
			return;
		};

		idRef.current = rootId;
		setIsLoading(true);

		C.ObjectShow(rootId, 'preview', U.Router.getRouteSpaceId(), () => {
			setIsLoading(false);

			if (setObject) {
				setObject(S.Detail.get(contextId, rootId, []));
			};
		});
	};

	const checkNumber = (block: I.Block, n: number) => {
		const isText = block.type == I.BlockType.Text;
		if ([ I.BlockType.Layout ].includes(block.type)) {
			n = 0;
		};
		if (isText && [ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3 ].includes(block.content.style)) {
			n = 0;
		};
		return n;
	};

	const getRootId = () => {
		return [ rootId, 'preview' ].join('-');
	};

	const update = () => {
		idRef.current = '';
		load();
	};

	const contextId = getRootId();
	const check = U.Data.checkDetails(contextId, rootId);
	const object = S.Detail.get(contextId, rootId);
	const { name, description, coverType, coverId, coverX, coverY, coverScale, iconImage } = object;
	const childBlocks = S.Block.getChildren(contextId, rootId, it => !it.isLayoutHeader()).slice(0, 10);
	const isTask = U.Object.isTaskLayout(object.layout);
	const isBookmark = U.Object.isBookmarkLayout(object.layou);
	const cn = [ 'previewObject' , check.className, className ];
	const withName = !U.Object.isNoteLayout(object.layout);
	const withIcon = check.withIcon || isTask || isBookmark;

	switch (size) {
		case I.PreviewSize.Large: {
			iconSize = 48;
			cnPreviewSize = 'large';
			break;
		};

		case I.PreviewSize.Medium: {
			iconSize = 40;
			cnPreviewSize = 'medium';
			break;
		};

		default:
		case I.PreviewSize.Small: {
			iconSize = 32;
			cnPreviewSize = 'small';
			break;
		};
	};

	cn.push(cnPreviewSize);

	if (isTask || isBookmark) {
		iconSize = 16;

		if (size == I.PreviewSize.Small) {
			iconSize = 14;
		};
	};

	useEffect(() => {
		load();
		rebind();

		const contextId = getRootId();
		const root = S.Block.wrapTree(contextId, rootId);

		if (root) {
			S.Block.updateNumbersTree([ root ]);
		};

		if (position) {
			position();
		};

		return () => {
			unbind();

			Action.pageClose(getRootId(), false);
		};
	});

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			onMouseEnter={onMouseEnterHandler}
			onMouseLeave={onMouseLeaveHandler}
		>
			{isLoading ? <Loader /> : (
				<>
					{onMore ? (
						<div id={`item-more-${rootId}`} className="moreWrapper" onClick={onMore}>
							<Icon />
						</div>
					) : ''}

					<div onClick={onClick} onContextMenu={onContextMenu}>
						<div className="scroller">
							{object.templateIsBundled ? <Icon className="logo" tooltipParam={{ text: translate('previewObjectTemplateIsBundled') }} /> : ''}

							{(coverType != I.CoverType.None) && coverId ? (
								<Cover 
									type={coverType} 
									id={coverId} 
									image={coverId} 
									className={coverId} 
									x={coverX} 
									y={coverY} 
									scale={coverScale} 
									withScale={true} 
								/>
							) : ''}

							<div className="heading">
								{withIcon ? <IconObject size={iconSize} object={object} /> : ''}
								{withName ? <ObjectName object={object} /> : ''}
								<div className="featured" />
							</div>

							<div className="blocks">
								{childBlocks.map((child: any, i: number) => {
									const cn = [ n % 2 == 0 ? 'even' : 'odd' ];

									if (i == 0) {
										cn.push('first');
									};

									if (i == childBlocks.length - 1) {
										cn.push('last');
									};

									n++;
									n = checkNumber(child, n);
									return <Block key={child.id} className={cn.join(' ')} {...child} />;
								})}
							</div>
						</div>
						<div className="border" />
					</div>
				</>
			)}
		</div>
	);
}));

export default PreviewObject;
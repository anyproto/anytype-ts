import React, { forwardRef, useRef, useEffect, useState, MouseEvent } from 'react';
import raf from 'raf';
import { Icon, IconObject, Loader, ObjectName, Cover, Label } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const BlockLink = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, onKeyDown, onKeyUp, getWrapperWidth } = props;
	const object = S.Detail.get(rootId, block.getTargetObjectId(), J.Relation.cover);
	const [ isRestored, setIsRestored ] = useState(false);
	const { _empty_, isDeleted, done, layout, coverId, coverType, coverX, coverY, coverScale } = object;
	const isArchived = object.isArchived && !isRestored;
	const content = U.Data.checkLinkSettings(block.content, layout);
	const readonly = props.readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
	const { description, cardStyle, relations, targetBlockId } = content;
	const nodeRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const type = S.Record.getTypeById(object.type);
	const cn = [ 'focusable', `c${block.id}` ];
	const canDescription = !U.Object.isNoteLayout(object.layout);
	const withIcon = content.iconSize != I.LinkIconSize.None;
	const withType = relations.includes('type');
	const withCover = relations.includes('cover') && coverId && coverType;

	if (U.Object.isTaskLayout(layout) && done) {
		cn.push('isDone');
	};

	if (isArchived) {
		cn.push('isArchived');
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

	const openMenu = (e: any) => {
		U.Menu.archivedContext(e, block.getTargetObjectId(), () => setIsRestored(true));
	};

	const onClick = (e: any) => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (
			object._empty_ ||
			(targetBlockId == rootId) ||
			(
				((e.ctrlKey || e.metaKey) && (ids.length > 1)) ||
				keyboard.isSelectionClearDisabled
			)
		) {
			return;
		};

		e.stopPropagation();
		U.Object.openEvent(e, object);
	};

	const onMouseEnter = (e: MouseEvent) => {
		if (!targetBlockId || (cardStyle != I.LinkCardStyle.Text)) {
			return;
		};

		Preview.previewShow({
			element: U.Dom.select('.cardName .name', nodeRef.current),
			object,
			target: targetBlockId,
			noUnlink: true,
			noEdit: true,
			passThrough: true,
		});
	};

	const onMouseLeave = () => {
		Preview.previewHide(true);
	};

	const getIconSize = () => {
		const object = S.Detail.get(rootId, block.getTargetObjectId(), [ 'layout' ], true);
		const content = U.Data.checkLinkSettings(block.content, object.layout);
		const { cardStyle } = content;

		let size = 24;
		let iconSize = 20;

		if ((cardStyle != I.LinkCardStyle.Text) && (content.iconSize == I.LinkIconSize.Medium)) {
			size = 48;
			iconSize = 28;
		};

		return { size, iconSize };
	};

	const resize = () => {
		window.setTimeout(() => {
			const node = nodeRef.current;
			const card = cardRef.current;
			if (!node || !card) {
				return;
			};

			U.Dom.toggleClass(card, 'withIcon', !!U.Dom.select('.iconObject', node));
			U.Dom.toggleClass(card, 'isVertical', U.Dom.contentWidth(node) <= getWrapperWidth() / 2);
		});
	};

	const { size, iconSize } = getIconSize();

	let element = null;
	if (_empty_) {
		element = (
			<div
				className="loading"
				{...U.Common.dataProps({ 'target-block-id': object.id })}
			>
				<Loader type={I.LoaderType.Loader} />
				<div className="name">{translate('blockLinkSyncing')}</div>
			</div>
		);
	} else
	if (isDeleted) {
		element = (
			<div className="deleted">
				<Icon name="common/ghost" className="ghost" />
				<div className="name">{translate('commonDeletedObject')}</div>
			</div>
		);
	} else {
		const isText = cardStyle == I.LinkCardStyle.Text;
		const isImage = object.layout == I.ObjectLayout.Image;
		const cnc = [ 'linkCard', U.Data.layoutClass(object.id, layout), `c${size}` ];
		const cns = [ 'sides' ];
		const cnl = [ 'side', 'left' ];

		if (isArchived && !isImage && !isText) {
			cnc[2] = 'c48';
		};

		if (withCover) {
			cnc.push('withCover');
		};

		if (block.bgColor) {
			cns.push('withBgColor');
			cnl.push(`bgColor bgColor-${block.bgColor}`);
		};
		const onCardClick = isArchived ? openMenu : (isText ? null : onClick);
		const onNameClick = (!isArchived && isText) ? onClick : null;

		let descr = '';
		let archive = null;
		let icon = null;
		let div = null;

		if (canDescription) {
			if (description == I.LinkDescription.Added) {
				descr = object.description;
			};
			if (description == I.LinkDescription.Content) {
				descr = object.snippet;
			};
		};

		if (isArchived) {
			archive = <div className="tagItem isMultiSelect archive">{translate('blockLinkArchived')}</div>;
		};

		if (isText) {
			div = (
				<div className="div">
					<div className="inner" />
				</div>
			);
		};

		if (withIcon) {
			if (isArchived && !isImage) {
				icon = (
					<IconObject
						id={`block-${block.id}-icon`}
						size={!isText ? 48 : size}
						iconSize={!isText ? 28 : iconSize}
						object={{ ...object, isDeleted: true }}
					/>
				);
			} else {
				const canEdit = !readonly && !isArchived && U.Object.isTaskLayout(object.layout);
				icon = (
					<IconObject
						id={`block-${block.id}-icon`}
						size={size}
						iconSize={iconSize}
						object={object}
						canEdit={canEdit}
						noClick={canEdit}
					/>
				);
			};
		};

		let n = 1;
		if (descr) n++;
		if (withType && type) n++;

		cnc.push(`c${n}`);

		element = (
			<div
				ref={cardRef}
				className={cnc.join(' ')}
				onMouseDown={onCardClick}
			>
				<div id="sides" className={cns.join(' ')}>
					<div key="sideLeft" className={cnl.join(' ')}>
						<div className="relationItem cardName" onMouseDown={onNameClick}>
							{icon}
							<div className="nameWrapper">
								<ObjectName
									object={object}
									onMouseEnter={onMouseEnter}
									onMouseLeave={onMouseLeave}
									withLatex={true}
									withPlural={true}
								/>
								{archive}
							</div>
						</div>

						{descr ? (
							<div className="relationItem cardDescription">
								{div}
								<Label className="description" text={U.Common.getLatex(descr)} />
							</div>
						) : ''}

						{withType && type ? (
							<div className="relationItem cardType">
								{div}
								<div className="item">{type.name}</div>
							</div>
						) : ''}
					</div>

					{withCover ? (
						<div className="side right">
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
						</div>
					) : ''}
				</div>
			</div>
		);
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
			onContextMenu={isArchived ? openMenu : undefined}
		>
			{element}
		</div>
	);

});

export default BlockLink;

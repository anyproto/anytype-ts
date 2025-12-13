import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject, Loader, ObjectName, Cover, Label } from 'Component';
import { I, S, U, J, translate, keyboard, focus, Preview } from 'Lib';

const BlockLink = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, onKeyDown, onKeyUp, getWrapperWidth } = props;
	const object = S.Detail.get(rootId, block.getTargetObjectId(), J.Relation.cover);
	const { _empty_, isArchived, isDeleted, done, layout, coverId, coverType, coverX, coverY, coverScale } = object;
	const content = U.Data.checkLinkSettings(block.content, layout);
	const readonly = props.readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
	const { description, cardStyle, relations, targetBlockId } = content;
	const nodeRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const type = S.Record.getTypeById(object.type);
	const cn = [ 'focusable', `c${block.id}`, 'resizable' ];
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

	const rebind = () => {
		unbind();
		$(nodeRef.current).on('resizeInit resizeMove', e => resize());
	};
	
	const unbind = () => {
		$(nodeRef.current).off('resizeInit resizeMove');
	};
	
	const onKeyDownHandler = (e: any) => {
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
	
	const onClick = (e: any) => {
		if (e.button) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (object._empty_ || (targetBlockId == rootId) || (keyboard.withCommand(e) && ids.length)) {
			return;
		};

		U.Object.openEvent(e, object);
	};
	
	const onMouseEnter = (e: React.MouseEvent) => {
		if (!targetBlockId || (cardStyle != I.LinkCardStyle.Text)) {
			return;
		};

		Preview.previewShow({ 
			element: $(nodeRef.current).find('.cardName .name'), 
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

		let size = 20;
		let iconSize = 20;

		if ((cardStyle != I.LinkCardStyle.Text) && (content.iconSize == I.LinkIconSize.Medium)) {
			size = 48;
			iconSize = 28;
		};

		return { size, iconSize };
	};

	const resize = () => {
		window.setTimeout(() => {
			const node = $(nodeRef.current);
			const card = $(cardRef.current);

			card.toggleClass('withIcon', !!node.find('.iconObject').length);
			card.toggleClass('isVertical', node.width() <= getWrapperWidth() / 2);
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
				<Icon className="ghost" />
				<div className="name">{translate('commonDeletedObject')}</div>
			</div>
		);
	} else {
		const cnc = [ 'linkCard', U.Data.layoutClass(object.id, layout), `c${size}` ];
		const cns = [ 'sides' ];
		const cnl = [ 'side', 'left' ];
		
		if (withCover) {
			cnc.push('withCover');
		};

		if (block.bgColor) {
			cns.push('withBgColor');
			cnl.push(`bgColor bgColor-${block.bgColor}`);
		};

		let descr = '';
		let archive = null;
		let icon = null;
		let div = null;
		let onCardClick = null;
		let onNameClick = null;

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

		if (cardStyle == I.LinkCardStyle.Text) {
			div = (
				<div className="div">
					<div className="inner" />
				</div>
			);
			onNameClick = onClick;
		} else {
			onCardClick = onClick;
		};

		if (withIcon) {
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

		let n = 1;
		if (descr) n++;
		if (withType && type) n++;

		cnc.push(`c${n}`);

		element = (
			<div 
				ref={cardRef}
				className={cnc.join(' ')}
				onClick={onCardClick}
			>
				<div id="sides" className={cns.join(' ')}>
					<div key="sideLeft" className={cnl.join(' ')}>
						<div className="relationItem cardName" onClick={onNameClick}>
							{icon}
							<ObjectName 
								object={object} 
								onMouseEnter={onMouseEnter} 
								onMouseLeave={onMouseLeave} 
								withLatex={true} 
								withPlural={true}
							/>
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

						{archive}
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
		>
			{element}
		</div>
	);

}));

export default BlockLink;
import React, { forwardRef, useRef, useState, MouseEvent, SyntheticEvent } from 'react';
import { DropTarget, Icon, IconObject, ObjectName, Label, ChatCounter } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

interface Props extends I.WidgetTreeItem {
	index: number;
	treeKey: string;
	style?: any;
	isSection?: boolean;
	onClick?(e: MouseEvent, props): void;
	onToggle?(e: MouseEvent, props): void;
	setActive?(id: string): void;
	getSubId?(id: string): string;
	getSubKey?(): string;
	onContext?(param: any): void;
};

const TreeItem = forwardRef<{}, Props>((props, ref) => {

	const { id, parentId, treeKey, depth, style, numChildren, isSection, getSubKey, getSubId, onContext, onClick, onToggle } = props;
	const { space } = S.Common;
	const nodeRef = useRef(null);
	const subKey = getSubKey();
	const subId = getSubId(parentId);
	const isOpen = Storage.checkToggle(subKey, treeKey);
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, isHidden, type, restrictions, done, layout } = object;
	const cn = [ 'item', `c${id}`, `depth${depth}` ];
	const rootId = keyboard.getRootId();
	const canDrop = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const paddingLeft = depth > 1 ? (depth - 1) * 8 : 4;
	const isChat = U.Object.isChatLayout(object.layout);
	const hasDiscussion = !isChat && !!object.discussionId;
	const counterTargetId = isChat ? id : (hasDiscussion ? object.discussionId : '');
	const hasUnreadSection = S.Common.checkWidgetSection(I.WidgetSection.Unread);
	const [ dummy, setDummy ] = useState(0);

	if (isOpen) {
		cn.push('isOpen');
	};

	if (isHidden) {
		cn.push('isHidden');
	};

	if (isSection) {
		cn.push('isSection');
	};

	const onContextHandler = (e: SyntheticEvent, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;

		onContext({
			node,
			element: node,
			withElement,
			subId,
			objectId: id,
			data: {
				allowedCollection: true,
				allowedLinkTo: true,
			},
		});
	};

	const onToggleHandler = (e: MouseEvent): void => {
		e.preventDefault();
		e.stopPropagation();

		onToggle(e, { ...props, details: object });
		setDummy(dummy + 1);
	};

	let arrow = null;
	let onArrowClick = null;
	let onContextMenu = null;
	let inner = null;

	if (U.Object.isSetLayout(layout) || (U.Object.isCollectionLayout(layout) && !numChildren)) {
		arrow = <Icon name="menu/action/set" className="set" />;
	} else
	if (numChildren > 0) {
		onArrowClick = onToggleHandler;
		arrow = <Icon name="arrow/select" className="arrow" />;
	} else {
		arrow = <Icon name="widget/blank" className="blank" />;
	};

	if (arrow) {
		arrow = <div className="arrowWrap" onMouseDown={onArrowClick}>{arrow}</div>;
	};

	if (isSection) {
		inner = (
			<div className="inner">
				<Label text={translate(U.String.toCamelCase([ 'common', id ].join('-')))} />
			</div>
		);
	} else {
		onContextMenu = e => onContextHandler(e, false);
		inner = (
			<div className="inner" style={{ paddingLeft }}>
				<div
					className="clickable"
					onMouseDown={e => onClick(e, object)}
				>
					{arrow}
					<IconObject 
						id={`widget-icon-${treeKey}`}
						object={object} 
						size={20} 
						iconSize={20}
						canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
						menuParam={{ 
							className: 'fixed',
							classNameWrap: 'fromSidebar',
						}}
					/>
					<ObjectName object={object} withPlural={true} />
				</div>

				{counterTargetId && !hasUnreadSection ? (
					<ChatCounter
						chatId={counterTargetId}
						mode={hasDiscussion ? U.Object.getDiscussionNotificationMode(U.Space.getSpaceview(), id) : undefined}
					/>
				) : ''}
			</div>
		);

		if (canDrop) {
			inner = (
				<DropTarget
					cacheKey={treeKey}
					id={object.id}
					rootId={rootId}
					targetContextId={object.id}
					dropType={I.DropType.Menu}
					canDropMiddle={true}
				>
					{inner}
				</DropTarget>
			);
		};
	};

	return (
		<div
			ref={nodeRef}
			id={treeKey}
			className={cn.join(' ')}
			style={style}
			onContextMenu={onContextMenu}
		>
			{inner}
		</div>
	);

});

export default TreeItem;
import React, { forwardRef, useRef, useState, MouseEvent, SyntheticEvent } from 'react';
import { observer } from 'mobx-react';
import { DropTarget, Icon, IconObject, ObjectName, Label } from 'Component';
import { I, S, U, J, keyboard, Storage, translate } from 'Lib';

interface Props extends I.WidgetTreeItem {
	index: number;
	treeKey: string;
	style?: any;
	isEditing?: boolean;
	isSection?: boolean;
	onClick?(e: React.MouseEvent, props): void;
	onToggle?(e: React.MouseEvent, props): void;
	setActive?(id: string): void;
	getSubId?(id: string): string;
	getSubKey?(): string;
	onContext?(param: any): void;
};

const TreeItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { id, parentId, treeKey, depth, style, numChildren, isEditing, isSection, getSubKey, getSubId, onContext, onClick, onToggle } = props;
	const nodeRef = useRef(null);
	const moreRef = useRef(null);
	const subKey = getSubKey();
	const subId = getSubId(parentId);
	const isOpen = Storage.checkToggle(subKey, treeKey);
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, isHidden, type, restrictions, done, layout } = object;
	const cn = [ 'item', `c${id}` ];
	const rootId = keyboard.getRootId();
	const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const paddingLeft = depth > 1 ? (depth - 1) * 8 : 4;
	const hasMore = U.Space.canMyParticipantWrite();
	const [ dummy, setDummy ] = useState(0);

	if (isOpen) {
		cn.push('isOpen');
	};

	if (isHidden) {
		cn.push('isHidden');
	};

	const onContextHandler = (e: SyntheticEvent, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = $(moreRef.current);

		onContext({ node, element, withElement, subId, objectId: id });
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
	let more = null;
	let inner = null;

	if (U.Object.isSetLayout(layout) || (U.Object.isCollectionLayout(layout) && !numChildren)) {
		arrow = <Icon className="set" />;
	} else
	if (numChildren > 0) {
		onArrowClick = onToggleHandler;
		arrow = <Icon className="arrow" />;
	} else {
		arrow = <Icon className="blank" />;
	};

	if (arrow) {
		arrow = <div className="arrowWrap" onMouseDown={onArrowClick}>{arrow}</div>;
	};

	if (hasMore) {
		more = <Icon ref={moreRef} className="more" tooltipParam={{ text: translate('widgetOptions') }} onMouseDown={e => onContextHandler(e, true)} />;
	};

	if (isSection) {
		inner = (
			<div className="inner">
				<Label text={translate(U.Common.toCamelCase([ 'common', id ].join('-')))} />
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
						size={18} 
						canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
						menuParam={{ 
							className: 'fixed',
							classNameWrap: 'fromSidebar',
						}}
					/>
					<ObjectName object={object} withPlural={true} />
				</div>

				<div className="buttons">{more}</div>
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

}));

export default TreeItem;
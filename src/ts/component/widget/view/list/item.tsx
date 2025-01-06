import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, Icon, IconObject, ObjectDescription, DropTarget, Label } from 'Component';
import { I, S, U, J, keyboard, analytics, translate } from 'Lib';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	index?: number;
	style?: any;
	isEditing?: boolean;
	isCompact?: boolean;
	isPreview?: boolean;
	isSection?: boolean;
};

const WidgetListItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { subId, id, block, style, isCompact, isEditing, index, isPreview, isSection, onContext } = props;
	const rootId = keyboard.getRootId();
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, restrictions, source } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const canDrag = isPreview && (block.getTargetObjectId() == J.Constant.widgetId.favorite);
	const hasMore = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const cn = [ 'item' ];

	if (canDrag) {
		cn.push('canDrag');
	};

	const onClick = (e: React.MouseEvent) => {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	const onContextHandler = (e: React.SyntheticEvent, withElement: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = node.find('.icon.more');

		onContext({ node, element, withElement, subId, objectId: id });
	};

	const resize = () => {
		const node = $(nodeRef.current);

		node.toggleClass('withIcon', !!node.find('.iconObject').length);
	};

	useEffect(() => resize());

	if (isSection) {
		return (
			<div
				ref={nodeRef}
				style={style}
				className={[ 'item', 'isSection' ].join(' ')}
			>
				<div className="inner">
					<Label text={translate(U.Common.toCamelCase([ 'common', id ].join('-')))} />
				</div>
			</div>
		);
	};

	const Handle = SortableHandle(() => (
		<Icon className="dnd" />
	));

	let descr = null;
	let more = null;

	if (!isCompact) {
		if (U.Object.isBookmarkLayout(object.layout)) {
			descr = <div className="descr">{U.Common.shortUrl(source)}</div>;
		} else {
			descr = <ObjectDescription object={object} />;
		};
	};

	if (hasMore) {
		more = <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => onContextHandler(e, true)} />;
	};
	
	let inner = (
		<div className="inner" onMouseDown={onClick}>
			<IconObject 
				id={iconKey}
				key={iconKey}
				object={object} 
				size={isCompact ? 18 : 48} 
				iconSize={isCompact ? 18 : 28}
				canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
				menuParam={{ 
					className: 'fixed',
					classNameWrap: 'fromSidebar',
				}}
			/>

			<div className="info">
				<ObjectName object={object} />
				{descr}
			</div>

			<div className="buttons">
				{more}
			</div>
		</div>
	);

	if (canDrag) {
		inner = (
			<React.Fragment>
				<Handle />
				{inner}
			</React.Fragment>
		);
	};

	if (canDrop) {
		inner = (
			<DropTarget
				cacheKey={[ block.id, object.id ].join('-')}
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

	const content = (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			key={object.id}
			onContextMenu={e => onContextHandler(e, false)}
			style={style}
		>
			{inner}
		</div>
	);

	if (canDrag) {
		const Element = SortableElement(() => content);
		return <Element index={index} />;
	} else {
		return content;
	};

}));

export default WidgetListItem;
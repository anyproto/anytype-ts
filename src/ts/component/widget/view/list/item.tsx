import React, { forwardRef, useEffect, useRef, SyntheticEvent, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ObjectName, Icon, IconObject, ObjectDescription, DropTarget, Label } from 'Component';
import { I, S, U, J, keyboard, analytics, translate } from 'Lib';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	index?: number;
	style?: any;
	isEditing?: boolean;
	isCompact?: boolean;
	isPreview?: boolean;
	isSection?: boolean;
	hideIcon?: boolean;
};

const WidgetListItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { subId, id, parent, block, isCompact, isEditing, isPreview, isSection, hideIcon, onContext } = props;
	const rootId = keyboard.getRootId();
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, isHidden, restrictions, source } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const canDrag = isPreview && (block.getTargetObjectId() == J.Constant.widgetId.favorite);
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: !canDrag });
	const hasMore = U.Space.canMyParticipantWrite();
	const nodeRef = useRef(null);
	const moreRef = useRef(null);
	const cn = [ 'item' ];
	const style = {
		...props.style,
		transform: CSS.Transform.toString(transform),
		transition,
	};

	if (canDrag) {
		cn.push('canDrag');
	};

	if (isHidden) {
		cn.push('isHidden');
	};

	const onClick = (e: MouseEvent) => {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject', { widgetType: analytics.getWidgetType(parent.content.autoAdded) });
	};

	const onContextHandler = (e: SyntheticEvent, withElement: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);

		onContext({ node, element: $(moreRef.current), withElement, subId, objectId: id });
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

	let descr = null;
	let more = null;
	let icon = null;

	if (!hideIcon) {
		icon = (
			<IconObject 
				id={iconKey}
				key={iconKey}
				object={object} 
				size={isCompact ? 20 : 48} 
				iconSize={isCompact ? 20 : 28}
				canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
				menuParam={{ 
					className: 'fixed',
					classNameWrap: 'fromSidebar',
				}}
			/>
		);
	};

	if (!isCompact) {
		if (U.Object.isBookmarkLayout(object.layout)) {
			descr = <div className="descr">{U.Common.shortUrl(source)}</div>;
		} else {
			descr = <ObjectDescription object={object} />;
		};
	};

	if (hasMore) {
		more = <Icon ref={moreRef} className="more" tooltipParam={{ text: translate('widgetOptions') }} onMouseDown={e => onContextHandler(e, true)} />;
	};
	
	let inner = (
		<div className="inner" onMouseDown={onClick}>
			{icon}

			<div className="info">
				<ObjectName object={object} withPlural={true} />
				{descr}
			</div>

			<div className="buttons">
				{more}
			</div>
		</div>
	);

	if (canDrag) {
		inner = (
			<>
				<Icon className="dnd" />
				{inner}
			</>
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

	return (
		<div
			className={cn.join(' ')}
			key={object.id}
			onContextMenu={e => onContextHandler(e, false)}
			ref={ref => {
				nodeRef.current = ref;
				setNodeRef(ref);
			}}
			{...attributes}
			{...listeners}
			style={style}
		>
			{inner}
		</div>
	);

}));

export default WidgetListItem;

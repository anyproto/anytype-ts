import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, IconObject, DropTarget, ObjectCover } from 'Component';
import { I, S, U, J, keyboard, analytics, Dataview } from 'Lib';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	isEditing?: boolean;
	hideIcon?: boolean;
};

const WidgetGalleryItem = observer(forwardRef<{}, Props>(({
	subId = '',
	id = '',
	parent,
	block,
	isEditing = false,
	hideIcon = false,
	getView,
}, ref) => {

	const nodeRef = useRef(null);
	const view = getView();
	const rootId = keyboard.getRootId();
	const object = S.Detail.get(subId, id, J.Relation.sidebar.concat(J.Relation.cover).concat(view.coverRelationKey));
	const { isReadonly, isArchived, restrictions } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const cn = [ 'item' ];
	const cover = view ? Dataview.getCoverObject(subId, object, view.coverRelationKey) : null;
	const nameRelation = view.getRelation('name');
	const withName = !cover || (cover && nameRelation?.isVisible);

	if (cover) {
		cn.push('withCover');
	};

	if (!withName) {
		cn.push('withoutName');
	};

	const onClick = (e: React.MouseEvent) => {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject', { widgetType: analytics.getWidgetType(parent.content.autoAdded) });
	};

	const onContext = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);

		S.Menu.open('objectContext', {
			element: node,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetX: node.outerWidth(true),
			vertical: I.MenuDirection.Center,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ id ],
				subId,
			},
		});
	};

	const resize = () => {
		const node = $(nodeRef.current);

		node.toggleClass('withIcon', !!node.find('.iconObject').length);
	};

	let icon = null;
	if (!hideIcon) {
		icon = (
			<IconObject 
				id={iconKey}
				key={iconKey}
				object={object} 
				size={16} 
				iconSize={16}
				canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
				menuParam={{ 
					className: 'fixed',
					classNameWrap: 'fromSidebar',
				}}
			/>
		);
	};

	let inner = (
		<div className="inner" onMouseDown={onClick}>
			<ObjectCover object={cover} />

			{withName ? (
				<div className="info">
					{icon}
					<ObjectName object={object} withPlural={true} />
				</div>
			) : ''}
		</div>
	);

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

	useEffect(() => resize());

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			onContextMenu={onContext}
		>
			{inner}
		</div>
	);

}));

export default WidgetGalleryItem;

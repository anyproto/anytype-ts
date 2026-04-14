import React, { forwardRef, useRef, useEffect, MouseEvent } from 'react';
import { ObjectName, IconObject, DropTarget, ObjectCover } from 'Component';
import * as I from 'Interface';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	hideIcon?: boolean;
	onResize?: () => void;
};

const WidgetGalleryItem = forwardRef<{}, Props>(({
	subId = '',
	id = '',
	block,
	hideIcon = false,
	getView,
	onResize,
}, ref) => {

	const nodeRef = useRef(null);
	const view = getView();
	const rootId = keyboard.getRootId();
	const object = S.Detail.get(subId, id, J.Relation.sidebar.concat(J.Relation.cover).concat(view.coverRelationKey));
	const { isReadonly, isArchived, restrictions } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
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

	const onClick = (e: MouseEvent) => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	const onContext = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;

		S.Menu.open('objectContext', {
			element: node,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetX: node?.offsetWidth || 0,
			vertical: I.MenuDirection.Center,
			onOpen: () => U.Dom.addClass(node, 'active'),
			onClose: () => U.Dom.removeClass(node, 'active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ id ],
				subId,
				allowedCollection: true,
				allowedLinkTo: true,
				openAfterDuplicate: true,
			},
		});
	};

	const resize = () => {
		const node = nodeRef.current;

		U.Dom.toggleClass(node, 'withIcon', !!U.Dom.select('.iconObject', node));
		onResize?.();
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

	useEffect(() => resize(), [ id, hideIcon ]);

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			onContextMenu={onContext}
		>
			{inner}
		</div>
	);

});

export default WidgetGalleryItem;
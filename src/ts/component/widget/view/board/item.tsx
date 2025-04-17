import React, { forwardRef, useRef, MouseEvent, SyntheticEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, Icon, IconObject, DropTarget } from 'Component';
import { I, S, U, J, keyboard, analytics, translate } from 'Lib';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	isEditing?: boolean;
	hideIcon?: boolean;
};

const WidgetBoardItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { subId, id, parent, block, isEditing, hideIcon, onContext, getView } = props;
	const nodeRef = useRef(null);
	const moreRef = useRef(null);
	const rootId = keyboard.getRootId();
	const view = getView();
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, restrictions } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const hasMore = U.Space.canMyParticipantWrite();

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
		const element = node.find('.icon.more');

		onContext({ 
			node, 
			element, 
			withElement, 
			subId, 
			objectId: id, 
			data: {
				relationKeys: J.Relation.default.concat(view.groupRelationKey),
			},
		});
	};

	let icon = null;
	let more = null;

	if (hasMore) {
		more = (
			<Icon 
				ref={moreRef} 
				className="more" 
				onMouseDown={e => onContextHandler(e, true)} 
				tooltipParam={{ text: translate('widgetOptions') }}
			/>
		);
	};

	if (!hideIcon) {
		icon = (
			<IconObject 
				id={iconKey}
				key={iconKey}
				object={object} 
				size={18} 
				iconSize={18}
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
			{icon}
			<ObjectName object={object} withPlural={true} />

			<div className="buttons">
				{more}
			</div>
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

	return (
		<div
			ref={nodeRef}
			className="item"
			key={object.id}
			onContextMenu={e => onContextHandler(e, false)}
		>
			{inner}
		</div>
	);

}));

export default WidgetBoardItem;
import React, { forwardRef, useRef, MouseEvent, SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ObjectName, Icon, IconObject, DropTarget } from 'Component';
import * as I from 'Interface';

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	hideIcon?: boolean;
};

const WidgetBoardItem = forwardRef<{}, Props>((props, ref) => {

	const { subId, id, block, hideIcon, onContext, getView } = props;
	const nodeRef = useRef(null);
	const moreRef = useRef(null);
	const rootId = keyboard.getRootId();
	const view = getView();
	const object = S.Detail.get(subId, id, J.Relation.sidebar);
	const { isReadonly, isArchived, restrictions } = object;
	const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
	const iconKey = `widget-icon-${block.id}-${id}`;
	const canDrop = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
	const hasMore = false;//U.Space.canMyParticipantWrite();

	const onClick = (e: MouseEvent) => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	const onContextHandler = (e: SyntheticEvent, withElement: boolean) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		const element = U.Dom.select('.icon.more', node);

		onContext({
			node,
			element,
			withElement,
			subId,
			objectId: id,
			data: {
				relationKeys: J.Relation.default.concat(view.groupRelationKey),
				allowedCollection: true,
				allowedLinkTo: true,
			},
		});
	};

	let icon = null;
	let more = null;

	if (hasMore) {
		more = (
			<Icon 
				ref={moreRef} 
				name="common/more" className="more" 
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
				size={20} 
				iconSize={20}
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
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef}
				className="item"
				key={object.id}
				onContextMenu={e => onContextHandler(e, false)}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{inner}
			</motion.div>
		</AnimatePresence>
	);

});

export default WidgetBoardItem;
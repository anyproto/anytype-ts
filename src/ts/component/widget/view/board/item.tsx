import * as React from 'react';
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

const WidgetBoardItem = observer(class WidgetBoardItem extends React.Component<Props> {

	node = null;
	frame = 0;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onContext = this.onContext.bind(this);
	};

	render () {
		const { subId, id, block, isEditing, hideIcon } = this.props;
		const rootId = keyboard.getRootId();
		const object = S.Detail.get(subId, id, J.Relation.sidebar);
		const { isReadonly, isArchived, restrictions } = object;
		const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const iconKey = `widget-icon-${block.id}-${id}`;
		const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const hasMore = U.Space.canMyParticipantWrite();
		const more = hasMore ? <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} /> : null;

		let icon = null;
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
			<div className="inner" onMouseDown={this.onClick}>
				{icon}
				<ObjectName object={object} />

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
				ref={node => this.node = node}
				className="item"
				key={object.id}
				onContextMenu={e => this.onContext(e, false)}
			>
				{inner}
			</div>
		);
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { subId, id, } = this.props;
		const object = S.Detail.get(subId, id, J.Relation.sidebar);

		U.Object.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	onContext (e: React.SyntheticEvent, withElement: boolean) {
		e.preventDefault();
		e.stopPropagation();

		const { subId, id, getView, onContext } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const node = $(this.node);
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

});

export default WidgetBoardItem;
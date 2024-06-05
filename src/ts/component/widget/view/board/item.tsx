import * as React from 'react';
import raf from 'raf';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, Icon, IconObject, DropTarget } from 'Component';
import { blockStore, menuStore, detailStore } from 'Store';
import { I, UtilObject, keyboard, analytics, translate, UtilSpace } from 'Lib';

const Constant = require('json/constant.json');

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	isEditing?: boolean;
	isPreview?: boolean;
};

const WidgetBoardItem = observer(class WidgetBoardItem extends React.Component<Props> {

	node = null;
	frame = 0;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onContext = this.onContext.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { subId, id, block, isEditing } = this.props;
		const rootId = keyboard.getRootId();
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, restrictions } = object;
		const allowedDetails = blockStore.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const iconKey = `widget-icon-${block.id}-${id}`;
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const hasMore = UtilSpace.canMyParticipantWrite();
		const more = hasMore ? <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} /> : null;

		let inner = (
			<div className="inner" onMouseDown={this.onClick}>
				<IconObject 
					id={iconKey}
					key={iconKey}
					object={object} 
					size={18} 
					iconSize={18}
					canEdit={!isReadonly && !isArchived && allowedDetails} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					onCheckbox={this.onCheckbox} 
					menuParam={{ 
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>

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

	componentDidMount (): void {
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { subId, id, } = this.props;
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

		UtilObject.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	onContext (e: React.SyntheticEvent, withElement: boolean) {
		e.preventDefault();
		e.stopPropagation();

		const { subId, id, getView } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const node = $(this.node);
		const more = node.find('.icon.more');
		const { x, y } = keyboard.mouse.page;
		const menuParam: any = {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ id ],
				subId,
				relationKeys: Constant.defaultRelationKeys.concat(view.groupRelationKey),
			},
		};

		if (withElement) {
			menuParam.element = more;
			menuParam.vertical = I.MenuDirection.Center;
			menuParam.offsetX = 32;
		} else {
			menuParam.rect = { width: 0, height: 0, x: x + 4, y };
		};

		menuStore.open('dataviewContext', menuParam);
	};

	onSelect (icon: string) {
		UtilObject.setIcon(this.props.id, icon, '');
	};

	onUpload (objectId: string) {
		UtilObject.setIcon(this.props.id, '', objectId);
	};

	onCheckbox () {
		const { subId, id } = this.props;
		const object = detailStore.get(subId, id, []);

		UtilObject.setDone(id, !object.done);
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			const node = $(this.node);
			const icon = node.find('.iconObject');

			icon.length ? node.addClass('withIcon') : node.removeClass('withIcon');
		});
	};

});

export default WidgetBoardItem;
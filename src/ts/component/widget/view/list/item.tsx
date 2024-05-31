import * as React from 'react';
import raf from 'raf';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, Icon, IconObject, ObjectDescription, DropTarget, Label } from 'Component';
import { blockStore, menuStore, detailStore } from 'Store';
import { I, UtilCommon, UtilObject, keyboard, analytics, translate, UtilSpace } from 'Lib';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';
const Constant = require('json/constant.json');

type Props = {
	block: I.Block;
	subId: string;
	id: string;
	index?: number;
	style?: any;
	isEditing?: boolean;
	isCompact?: boolean;
	isPreview?: boolean;
	isSection?: boolean;
};

const WidgetListItem = observer(class WidgetListItem extends React.Component<Props> {

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
		const { subId, id, block, style, isCompact, isEditing, index, isPreview, isSection } = this.props;
		const rootId = keyboard.getRootId();
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, restrictions, source } = object;
		const allowedDetails = blockStore.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const iconKey = `widget-icon-${block.id}-${id}`;
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const canDrag = isPreview && (block.content.targetBlockId == Constant.widgetId.favorite);
		const hasMore = UtilSpace.canMyParticipantWrite();

		if (isSection) {
			return (
				<div
					ref={node => this.node = node}
					style={style}
					className={[ 'item', 'isSection' ].join(' ')}
				>
					<div className="inner">
						<Label text={translate(UtilCommon.toCamelCase([ 'common', id ].join('-')))} />
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
			if (object.layout == I.ObjectLayout.Bookmark) {
				descr = <div className="descr">{UtilCommon.shortUrl(source)}</div>;
			} else {
				descr = <ObjectDescription object={object} />;
			};
		};

		if (hasMore) {
			more = <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} />;
		};
		
		let inner = (
			<div className="inner" onMouseDown={this.onClick}>
				<IconObject 
					id={iconKey}
					key={iconKey}
					object={object} 
					size={isCompact ? 18 : 48} 
					iconSize={isCompact ? 18 : 28}
					canEdit={!isReadonly && !isArchived && allowedDetails} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					onCheckbox={this.onCheckbox} 
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
				ref={node => this.node = node}
				className={[ 'item', (canDrag ? 'canDrag' : '') ].join(' ')}
				key={object.id}
				onContextMenu={e => this.onContext(e, false)}
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

		const { subId, id } = this.props;
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
		const { id } = this.props;

		UtilObject.setIcon(id, icon, '');
	};

	onUpload (objectId: string) {
		UtilObject.setIcon(this.props.id, '', objectId);
	};

	onCheckbox () {
		const { subId, id } = this.props;
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

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

export default WidgetListItem;

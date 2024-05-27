import * as React from 'react';
import { observer } from 'mobx-react';
import { DropTarget, Icon, IconObject, ObjectName, Label } from 'Component';
import { I, keyboard, Storage, UtilObject, translate, UtilCommon, UtilSpace, analytics } from 'Lib';
import { blockStore, dbStore, detailStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

interface Props extends I.WidgetTreeItem {
	block: I.Block;
	index: number;
	treeKey: string;
	style?;
	isEditing?: boolean;
	isSection?: boolean;
	onClick?(e: React.MouseEvent, props): void;
	onToggle?(e: React.MouseEvent, props): void;
	setActive?(id: string): void;
	getSubId?(id: string): string;
	getSubKey?(): string;
};

const TreeItem = observer(class Node extends React.Component<Props> { 
		
	node = null;

	constructor (props: Props) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { id, parentId, treeKey, depth, style, numChildren, isEditing, onClick, isSection, getSubKey, getSubId } = this.props;
		const subKey = getSubKey();
		const subId = getSubId(parentId);
		const isOpen = Storage.checkToggle(subKey, treeKey);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, type, restrictions, done, layout } = object;
		const cn = [ 'item', 'c' + id, (isOpen ? 'isOpen' : '') ];
		const rootId = keyboard.getRootId();
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const allowedDetails = blockStore.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const paddingLeft = depth > 1 ? (depth - 1) * 12 : 6;
		const hasMore = UtilSpace.canMyParticipantWrite();

		let arrow = null;
		let onArrowClick = null;
		let more = null;

		if (isSection) {
			cn.push('isSection');

			return (
				<div
					ref={node => this.node = node}
					style={style}
					id={treeKey}
					className={cn.join(' ')}
				>
					<div className="inner">
						<Label text={translate(UtilCommon.toCamelCase([ 'common', id ].join('-')))} />
					</div>
				</div>
			);
		};

		/*
		if (layout == I.ObjectLayout.Collection) {
			arrow = <Icon className="collection" />;
		} else
		*/
		if (layout == I.ObjectLayout.Set) {
			arrow = <Icon className="set" />;
		} else
		if (numChildren > 0) {
			onArrowClick = this.onToggle;
			arrow = <Icon className="arrow" />;
		} else {
			arrow = <Icon className="blank" />;
		};

		if (arrow) {
			arrow = <div className="arrowWrap" onMouseDown={onArrowClick}>{arrow}</div>;
		};

		if (hasMore) {
			more = <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} />;
		};

		let inner = (
			<div className="inner" style={{ paddingLeft }}>
				<div
					className="clickable"
					onMouseDown={e => onClick(e, object)}
				>
					{arrow}
					<IconObject 
						id={`widget-icon-${treeKey}`}
						object={object} 
						size={20} 
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
				</div>

				<div className="buttons">
					{more}
				</div>
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

		return (
			<div
				ref={node => this.node = node}
				id={treeKey}
				className={cn.join(' ')}
				style={style}
				onContextMenu={e => this.onContext(e, false)}
			>
				{inner}
			</div>
		);
	};

	onContext = (e: React.SyntheticEvent, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const { id, parentId, getSubId } = this.props;
		const subId = getSubId(parentId);
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

	onToggle (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		const { id, parentId, onToggle, getSubId } = this.props;
		const object = detailStore.get(getSubId(parentId), id, Constant.sidebarRelationKeys, true);

		onToggle(e, { ...this.props, details: object });
		this.forceUpdate();
	};

	onSelect (icon: string) {
		UtilObject.setIcon(this.props.id, icon, '');
	};

	onUpload (objectId: string) {
		UtilObject.setIcon(this.props.id, '', objectId);
	};

	onCheckbox () {
		const { id, parentId, getSubId } = this.props;
		const object = detailStore.get(getSubId(parentId), id, Constant.sidebarRelationKeys);

		UtilObject.setDone(id, !object.done);
	};

});

export default TreeItem;

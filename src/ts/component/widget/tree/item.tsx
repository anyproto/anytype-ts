import * as React from 'react';
import { observer } from 'mobx-react';
import { DropTarget, Icon, IconObject, ObjectName } from 'Component';
import { I, keyboard, Storage, UtilObject, translate } from 'Lib';
import { blockStore, dbStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.WidgetTreeItem {
	block: I.Block;
	index: number;
	treeKey: string;
	style?;
	isEditing?: boolean;
	onClick?(e: React.MouseEvent, props): void;
	onToggle?(e: React.MouseEvent, props): void;
	setActive?(id: string): void;
	getSubId?(id: string): string;
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
		const { id, parentId, treeKey, depth, style, numChildren, isEditing, onClick } = this.props;
		const subKey = this.getSubKey();
		const subId = dbStore.getSubId(subKey, parentId);
		const isOpen = Storage.checkToggle(subKey, treeKey);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, type, restrictions, done } = object;
		const cn = [ 'item', 'c' + id, (isOpen ? 'isOpen' : '') ];
		const rootId = keyboard.getRootId();
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const paddingLeft = depth > 1 ? (depth - 1) * 12 : 6;

		let arrow = null;
		let onArrowClick = null;

		if (type == Constant.typeId.collection) {
			arrow = <Icon className="collection" />;
		} else
		if (type == Constant.typeId.set) {
			arrow = <Icon className="set" />;
		} else
		if (numChildren > 0) {
			onArrowClick = this.onToggle;
			arrow = <Icon className="arrow" />;
		} else {
			arrow = <Icon className="blank" />;
		};

		if (arrow) {
			arrow = (
				<div className="arrowWrap" onMouseDown={onArrowClick}>{arrow}</div>
			);
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
						canEdit={!isReadonly && !isArchived} 
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
					<Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} />
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
			onOpen: () => { node.addClass('active'); },
			onClose: () => { node.removeClass('active'); },
			data: {
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

		const { id, parentId, onToggle } = this.props;
		const subId = dbStore.getSubId(this.getSubKey(), parentId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);

		onToggle(e, { ...this.props, details: object });
		this.forceUpdate();
	};

	getSubKey (): string {
		return `widget${this.props.block.id}`;
	};

	onSelect (icon: string) {
		const { id } = this.props;

		UtilObject.setIcon(id, icon, '');
	};

	onUpload (hash: string) {
		const { id } = this.props;

		UtilObject.setIcon(id, '', hash);
	};

	onCheckbox () {
		const { id, parentId } = this.props;
		const subKey = this.getSubKey();
		const subId = dbStore.getSubId(subKey, parentId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

		UtilObject.setDone(id, !object.done);
	};

});

export default TreeItem;

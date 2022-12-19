// Third Party
import * as React from 'react';
import { observer } from 'mobx-react';

// Data Layer
import { dbStore, detailStore, blockStore } from 'Store';

// Libraries
import { I, Storage, keyboard } from 'Lib';

// UI Components
import { Icon, IconObject, ObjectName, DropTarget } from 'Component';

// Models
import { TreeNode } from './model';

import Constant from 'json/constant.json';

type Props = {
	index: number;
	treeId: string;
	style: any;
	onClick?(e: React.MouseEvent, props: any): void;
	onToggle?(e: React.MouseEvent, props: any): void;
	onContext?(e: React.MouseEvent, props: any): void;
} & TreeNode;

const Node = observer(class Node extends React.Component<Props, object> {

	constructor (props: Props) {
		super(props);
		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { id, treeId, depth, style, numChildren, withPadding, onClick, onContext } = this.props;
		const parentId = this.props.isSection === true ? "" : this.props.parentId;
		const subId = dbStore.getSubId(Constant.subId.sidebar, parentId);
		const isOpen = Storage.checkToggle(Constant.subId.sidebar, treeId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);
		const cn = [ 'item', 'c' + id, (isOpen ? 'active' : '') ];
		const rootId = keyboard.getRootId();
		const canDrop = !this.props.isSection && blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]) && ![ Constant.typeId.bookmark ].includes(object.type);

		let content = null;
		let paddingLeft = 10 + depth * 12;

		if (this.props.isSection) {
			paddingLeft += 6;
			cn.push('isSection');
			
			if (withPadding) {
				cn.push('withPadding');
			};

			content = (
				<div className="clickable" onClick={this.onToggle}>
					<div className="name">{this.props.name}</div>
					<Icon className="arrow" />
				</div>
			);
		} else {
			let arrow = null;
			if (numChildren > 0) {
				arrow = <Icon className="arrow" onClick={this.onToggle} />;
			} else 
			if (object.type == Constant.typeId.set) {
				arrow = <Icon className="set" />
			} else {
				arrow = <Icon className="blank" />
			};

			content = (
				<div className="clickable" onClick={(e: React.MouseEvent) => { onClick(e, { ...this.props, details: object }); }}>
					{arrow}
					<IconObject object={object} size={20} />
					<ObjectName object={object} />
				</div>
			);
		};

		let inner = (
			<div className="inner" style={{ paddingLeft }}>
				{content}
			</div>
		);

		if (canDrop) {
			inner = (
				<DropTarget 
					cacheKey={treeId}
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
				id={treeId}
				className={cn.join(' ')} 
				style={style} 
				onContextMenu={(e: React.MouseEvent) => { onContext(e, { ...this.props, details: object }); }}
			>
				{inner}
			</div>
		);
	};

	onToggle (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const { id, onToggle } = this.props;
		const parentId = this.props.isSection === true ? "" : this.props.parentId;
		const subId = dbStore.getSubId(Constant.subId.sidebar, parentId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);

		onToggle(e, { ...this.props, details: object });
	};
	
});

export default Node;
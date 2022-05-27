import * as React from 'react';
import { Icon, IconObject, ObjectName, DropTarget } from 'ts/component';
import { I, Storage, keyboard } from 'ts/lib';
import { dbStore, detailStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	id: string;
	index: number;
	parentId: string;
	elementId: string;
	depth: number;
	length: number;
	isSection?: boolean;
	style: any;
	details: any;
	withPadding?: boolean;
	onClick?(e: any, item: any): void;
	onToggle?(e: any, item: any): void;
	onContext?(e: any, item: any): void;
};

const Constant = require('json/constant.json');

const Item = observer(class Item extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { id, parentId, elementId, depth, style, length, details, isSection, withPadding, onClick, onContext } = this.props;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, parentId);
		const check = Storage.checkToggle(Constant.subIds.sidebar, elementId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);
		const cn = [ 'item', 'c' + id, (check ? 'active' : '') ];
		const rootId = keyboard.getRootId();
		const canDrop = !isSection && blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Block ]);

		let content = null;
		let paddingLeft = 10 + depth * 12;

		if (isSection) {
			paddingLeft += 6;
			cn.push('isSection');
			
			if (withPadding) {
				cn.push('withPadding');
			};

			content = (
				<div className="clickable" onClick={this.onToggle}>
					<div className="name">{details.name}</div>
					<Icon className="arrow" />
				</div>
			);
		} else {
			let arrow = null;
			if (length) {
				arrow = <Icon className="arrow" onClick={this.onToggle} />;
			} else 
			if (object.type == Constant.typeId.set) {
				arrow = <Icon className="set" />
			} else {
				arrow = <Icon className="blank" />
			};

			content = (
				<div className="clickable" onClick={(e: any) => { onClick(e, { ...this.props, details: object }); }}>
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
					cacheKey={elementId}
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
				id={elementId}
				className={cn.join(' ')} 
				style={style} 
				onContextMenu={(e: any) => { onContext(e, { ...this.props, details: object }); }}
			>
				{inner}
			</div>
		);
	};

	onToggle (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { id, parentId, onToggle } = this.props;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, parentId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);

		onToggle(e, { ...this.props, details: object });
	};
	
});

export default Item;
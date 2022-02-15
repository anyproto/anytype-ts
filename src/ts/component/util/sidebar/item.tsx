import * as React from 'react';
import { Icon, IconObject, ObjectName } from 'ts/component';
import { Storage } from 'ts/lib';
import { dbStore, detailStore } from 'ts/store';
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
	onMouseEnter?(e: any, item: any): void;
	onMouseLeave?(e: any, item: any): void;
};

const Constant = require('json/constant.json');

const Item = observer(class Item extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { id, parentId, elementId, depth, style, length, details, isSection, withPadding, onClick, onContext, onMouseEnter, onMouseLeave } = this.props;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, parentId);
		const check = Storage.checkToggle(Constant.subIds.sidebar, elementId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);
		const cn = [ 'item', 'c' + id, (check ? 'active' : '') ];

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
					<IconObject object={object} size={20} forceLetter={true} />
					<ObjectName object={object} />
				</div>
			);
		};

		return (
			<div 
				id={elementId}
				className={cn.join(' ')} 
				style={style} 
				onMouseEnter={(e: any) => { onMouseEnter(e, this.props); }}
				onMouseLeave={(e: any) => { onMouseLeave(e, this.props); }}
				onContextMenu={(e: any) => { onContext(e, { ...this.props, details: object }); }}
			>
				<div className="inner" style={{ paddingLeft }}>
					{content}
				</div>
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
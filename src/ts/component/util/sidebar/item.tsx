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
};

const Constant = require('json/constant.json');

const Item = observer(class Item extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { id, parentId, elementId, depth, length, details, isSection, withPadding, onClick, onToggle, onContext } = this.props;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, parentId);
		const check = Storage.checkToggle(Constant.subIds.sidebar, elementId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);
		const style = { ...this.props.style, paddingLeft: (10 + depth * 12) };
		const cn = [ 'item', (check ? 'active' : '') ];

		let content = null;
		if (isSection) {
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
				id={'item-' + elementId} 
				className={cn.join(' ')} 
				style={style} 
				onContextMenu={(e: any) => { onContext(e, { ...this.props, details: object }); }}
			>
				<div className="inner">
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
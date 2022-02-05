import * as React from 'react';
import { Icon, IconObject, ObjectName } from 'ts/component';
import { Storage } from 'ts/lib';
import { dbStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	id: string;
	parentId: string;
	elementId: string;
	depth: number;
	length: number;
	isSection?: boolean;
	style: any;
	details: any;
	onClick?(e: any, item: any): void;
	onToggle?(e: any, item: any): void;
	onContext?(e: any, item: any): void;
};

const Constant = require('json/constant.json');

const Item = observer(class Item extends React.Component<Props, {}> {

	public static defaultProps = {
    };

	render () {
		const { id, parentId, elementId, depth, length, details, isSection, onClick, onToggle, onContext } = this.props;
		const subId = dbStore.getSubId(Constant.subIds.sidebar, parentId);
		const check = Storage.checkToggle(Constant.subIds.sidebar, elementId);
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys, true);
		const style = { ...this.props.style, paddingLeft: (6 + depth * 12) };
		const cn = [ 'item', (check ? 'active' : '') ];

		let content = null;
		let arrow = null;

		if (isSection) {
			cn.push('isSection');

			content = (
				<div className="clickable" onClick={(e: any) => { onToggle(e, this.props); }}>
					<div className="name">{details.name}</div>
					<div className="cnt">{length || ''}</div>
				</div>
			);
		} else {
			content = (
				<div className="clickable" onClick={(e: any) => { onClick(e, this.props); }}>
					<IconObject object={object} size={20} forceLetter={true} />
					<ObjectName object={object} />
				</div>
			);
		};

		if (length) {
			arrow = <Icon className="arrow" onMouseDown={(e: any) => { onToggle(e, this.props); }} />;
		} else {
			arrow = <Icon className="blank" />
		};

		return (
			<div id={'item-' + elementId} className={cn.join(' ')} style={style} onContextMenu={(e: any) => { onContext(e, this.props); }}>
				{arrow}
				{content}
			</div>
		);
	};
	
});

export default Item;
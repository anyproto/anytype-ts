import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilData } from 'Lib';
import { dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

const MenuSpace = observer(class MenuSpace extends React.Component<I.Menu> {

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this)
	};
	
	render () {
		const items = this.getItems();

		const Item = (item) => (
			<div className="item" onClick={this.onClick}>
				<div className="iconWrap">
					<IconObject object={item} size={96} />
				</div>
				<ObjectName object={item} />
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
			>
				<div className="head">
				</div>
				<div className="items">
					{items.map((item) => (
						<Item key={`item-space-${item.id}`} {...item} />
					))}
				</div>
			</div>
		);
	};

	getItems () {
		const subId = Constant.subId.space;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, UtilData.spaceRelationKeys()));
	};

	onClick () {
	};

	resize () {
	};
	
});

export default MenuSpace;
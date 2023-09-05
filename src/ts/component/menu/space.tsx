import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, UtilData, UtilObject, UtilRouter } from 'Lib';
import { dbStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

const MenuSpace = observer(class MenuSpace extends React.Component<I.Menu> {

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};
	
	render () {
		const items = this.getItems();
		const space = UtilObject.getWorkspace();
		const profile = UtilObject.getProfile();

		const Item = (item) => (
			<div className={[ 'item', (item.spaceId == space.spaceId ? 'active' : '') ].join(' ')} onClick={e => this.onClick(e, item)}>
				<div className="iconWrap">
					<IconObject object={item} size={96} forceLetter={true} />
				</div>
				<ObjectName object={item} />
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head">
					<div className="side left">
						<IconObject object={profile} size={40} />
						<ObjectName object={profile} />
					</div>
					<div className="side left">
						<Icon className="settings" onClick={this.onSettings} />
					</div>
				</div>
				<div className="items">
					{items.map((item) => (
						<Item key={`item-space-${item.id}`} {...item} />
					))}
					<div className="item add" onClick={this.onAdd}>
						<div className="iconWrap" />
					</div>
				</div>
			</div>
		);
	};

	getItems () {
		const subId = Constant.subId.space;
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, UtilData.spaceRelationKeys()));
	};

	onClick (e: any, item: any) {
		UtilRouter.switchSpace(item.spaceId);
		this.props.close();
	};

	onAdd () {
		popupStore.open('settings', { data: { page: 'spaceCreate', isSpace: true }, className: 'isSpaceCreate' });
		this.props.close();
	};

	onSettings () {
		popupStore.open('settings', {});
		this.props.close();
	};

	resize () {
		this.props.position();
	};
	
});

export default MenuSpace;
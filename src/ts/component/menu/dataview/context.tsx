import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, analytics, DataUtil, focus } from 'ts/lib';
import { detailStore, menuStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class MenuContext extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								icon={action.icon || action.id}
								withCaption={action.caption} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
								onClick={(e: any) => { this.onClick(e, action); }} 
							/>
						);
					})}
				</div>
			</div>
		);

		return (
			<div>
				{sections.map((item: any, i: number) => (
					<Section key={i} index={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};
	
	componentWillUnmount () {
		menuStore.closeAll(Constant.menuIds.more);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { subId, objectId } = data;
		const object = detailStore.get(subId, objectId);
		
		let archive = null;
		let fav = null;

		let pageRemove = { id: 'pageRemove', icon: 'remove', name: 'Delete' };
		let pageCopy = { id: 'pageCopy', icon: 'copy', name: 'Duplicate' };

		if (object.isFavorite) {
			fav = { id: 'unfav', name: 'Remove from Favorites' };
		} else {
			fav = { id: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			archive = { id: 'pageUnarchive', icon: 'restore', name: 'Restore from bin' };
		} else {
			archive = { id: 'pageArchive', icon: 'remove', name: 'Move to bin' };
		};

		// Restrictions
		const allowedArchive = !object.isReadonly;
		const allowedDelete = allowedArchive && object.isArchived;
		const allowedFav = !object.isReadonly && !object.isArchived;

		if (!allowedArchive)	 archive = null;
		if (!allowedDelete)		 pageRemove = null;
		if (!allowedFav)		 fav = null;

		let sections = [
			{ children: [ fav, pageCopy, archive, pageRemove ] },
		];

		sections = sections.filter((section: any) => {
			section.children = section.children.filter((child: any) => { return child; });
			return section.children.length > 0;
		});

		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { subId, objectId } = data;
		const object = detailStore.get(subId, objectId);

		focus.clear(false);
		
		switch (item.id) {

			case 'pageCopy':
				C.ObjectDuplicate(objectId, (message: any) => {
					if (!message.error.code) {
						DataUtil.objectOpenPopup({ id: message.id, layout: object.layout });
					};
				});
				break;

			case 'pageArchive':
				C.ObjectSetIsArchived(objectId, true, (message: any) => {
					if (message.error.code) {
						return;
					};
					analytics.event('MoveToBin', { count: 1 });
				});
				break;

			case 'pageUnarchive':
				C.ObjectSetIsArchived(objectId, false, (message: any) => {
					if (message.error.code) {
						return;
					};
					analytics.event('RestoreFromBin', { count: 1 });
				});
				break;

			case 'pageRemove':
				C.ObjectListDelete([ objectId ], (message: any) => {
					analytics.event('RemoveCompletely', { count: 1 });
				});
				break;

			case 'fav':
				C.ObjectSetIsFavorite(objectId, true, () => {
					analytics.event('AddToFavorites', { count: 1 });
				});
				break;

			case 'unfav':
				C.ObjectSetIsFavorite(objectId, false, () => {
					analytics.event('RemoveFromFavorites', { count: 1 });
				});
				break;
		};
		
		close();
	};

};

export default MenuContext;
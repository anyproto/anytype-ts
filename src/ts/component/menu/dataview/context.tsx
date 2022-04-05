import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, analytics, DataUtil, focus } from 'ts/lib';
import { detailStore, menuStore, blockStore } from 'ts/store';

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
		const { subId, objectIds } = data;
		const length = objectIds.length;

		let pageCopy = { id: 'copy', icon: 'copy', name: 'Duplicate' };
		let archive = null;
		let archiveCnt = 0;
		let fav = null;
		let favCnt = 0;

		let allowedArchive = true;
		let allowedFav = true;

		objectIds.forEach((it: string) => {
			const object = detailStore.get(subId, it);

			if (object.isFavorite) favCnt++;
			if (object.isArchived) archiveCnt++;

			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]) || object.isArchived) {
				allowedFav = false;
			};
		});

		if (favCnt == length) {
			fav = { id: 'unfav', name: 'Remove from Favorites' };
		} else {
			fav = { id: 'fav', name: 'Add to Favorites' };
		};

		if (archiveCnt == length) {
			archive = { id: 'unarchive', icon: 'restore', name: 'Restore from bin' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to bin' };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedFav)		 fav = null;

		let sections = [
			{ children: [ fav, pageCopy, archive ] },
		];

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
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
		const { objectIds } = data;
		const length = objectIds.length;

		focus.clear(false);
		
		switch (item.id) {

			case 'copy':
				/*
				C.ObjectDuplicate(objectId, (message: any) => {
					if (!message.error.code) {
						DataUtil.objectOpenPopup({ id: message.id, layout: object.layout });
					};
				});
				*/
				break;

			case 'archive':
				C.ObjectListSetIsArchived(objectIds, true, (message: any) => {
					if (message.error.code) {
						return;
					};
					analytics.event('MoveToBin', { count: length });
				});
				break;

			case 'unarchive':
				C.ObjectListSetIsArchived(objectIds, false, (message: any) => {
					if (message.error.code) {
						return;
					};
					analytics.event('RestoreFromBin', { count: length });
				});
				break;

			case 'fav':
				C.ObjectListSetIsFavorite(objectIds, true, () => {
					analytics.event('AddToFavorites', { count: length });
				});
				break;

			case 'unfav':
				C.ObjectListSetIsFavorite(objectIds, false, () => {
					analytics.event('RemoveFromFavorites', { count: length });
				});
				break;
		};
		
		close();
	};

};

export default MenuContext;
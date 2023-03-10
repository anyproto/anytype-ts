import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, keyboard, analytics, Util, ObjectUtil, focus } from 'Lib';
import { detailStore, menuStore, blockStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

class MenuContext extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
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
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon || action.id}
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				{sections.length ? (
					<React.Fragment>
						{sections.map((item: any, i: number) => (
							<Section key={i} index={i} {...item} />
						))}
					</React.Fragment>
				) : (
					<div className="item empty">No available actions</div>
				)}
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
		$(window).off('keydown.menu');
	};
	
	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { subId, objectIds, getObject, isCollection } = data;
		const length = objectIds.length;

		let pageCopy = { id: 'copy', icon: 'copy', name: 'Duplicate' };
		let open = { id: 'open', icon: 'expand', name: 'Open as object' };
		let linkTo = { id: 'linkTo', icon: 'linkTo', name: 'Link to', arrow: true };
		let addToCollection = { id: 'addToCollection', icon: 'linkTo', name: 'Add to collection', arrow: true };
		let unlink = null;
		let archive = null;
		let archiveCnt = 0;
		let fav = null;
		let favCnt = 0;

		let allowedArchive = true;
		let allowedFav = true;
		let allowedCopy = true;

		if (isCollection) {
			addToCollection = null;
			unlink = { id: 'unlink', icon: 'unlink', name: 'Unlink from collection' };
		};

		objectIds.forEach((it: string) => {
			let object = null; 
			if (getObject) {
				object = getObject(it);
			} else
			if (subId) {
				object = detailStore.get(subId, it);
			};

			if (!object || object._empty_) {
				return;
			};

			if (object.isFavorite) favCnt++;
			if (object.isArchived) archiveCnt++;

			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]) || object.isArchived) {
				allowedFav = false;
			};
			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Duplicate ])) {
				allowedCopy = false;
			};
		});

		if (favCnt == length) {
			fav = { id: 'unfav', name: 'Remove from Favorites' };
		} else {
			fav = { id: 'fav', name: 'Add to Favorites' };
		};

		if (length > 1) {
			open = null;
			linkTo = null;
		};

		if (archiveCnt == length) {
			open = null;
			linkTo = null;
			unlink = null;
			addToCollection = null;
			archive = { id: 'unarchive', icon: 'restore', name: 'Restore from bin' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to bin' };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedFav)		 fav = null;
		if (!allowedCopy)		 pageCopy = null;

		let sections = [
			{ children: [ open, fav, linkTo, addToCollection, pageCopy, unlink, archive ] },
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
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data, classNameWrap } = param;
		const { objectIds, onLinkTo } = data;
		const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (!item.arrow || !objectIds.length) {
			menuStore.closeAll(Constant.menuIds.more)
			return;
		};

		let itemId = objectIds[0];
		let menuId = '';
		let menuParam = {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			classNameWrap,
			data: {
				rebind: this.rebind,
			}
		};

		switch (item.id) {
			case 'linkTo':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
						{ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false }
					],
					rootId: itemId,
					blockId: itemId,
					blockIds: [ itemId ],
					type: I.NavigationType.LinkTo,
					skipIds: [ itemId ],
					position: I.BlockPosition.Bottom,
					canAdd: true,
					onSelect: (el: any) => {
						if (onLinkTo) {
							onLinkTo(itemId, el.id);
						};

						close();
					}
				});
				break;

			case 'addToCollection':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.collection },
						{ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false }
					],
					rootId: itemId,
					blockId: itemId,
					blockIds: [ itemId ],
					skipIds: [ itemId ],
					position: I.BlockPosition.Bottom,
					canAdd: true,
					onSelect: (el: any) => {
						C.ObjectCollectionAdd(el.id, objectIds);

						close();
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.more, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onClick (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { subId, objectIds, onSelect, targetId } = data;
		const win = $(window);
		const length = objectIds.length;
		const cb = () => {
			if (onSelect) {
				onSelect(item.id);
			};
		};

		focus.clear(false);
		
		switch (item.id) {

			case 'open':
				ObjectUtil.openPopup(detailStore.get(subId, objectIds[0], []));
				break;

			case 'copy':
				C.ObjectListDuplicate(objectIds, (message: any) => {
					if (length == 1) {
						ObjectUtil.openPopup(detailStore.get(subId, message.ids[0], []));
					};

					cb();
					analytics.event('DuplicateObject', { count: length });
				});
				break;

			case 'archive':
				C.ObjectListSetIsArchived(objectIds, true, (message: any) => {
					cb();
					analytics.event('MoveToBin', { count: length });
				});

				win.trigger('removeGraphNode', { ids: objectIds });
				break;

			case 'unarchive':
				C.ObjectListSetIsArchived(objectIds, false, (message: any) => {
					cb();
					analytics.event('RestoreFromBin', { count: length });
				});
				break;

			case 'fav':
				C.ObjectListSetIsFavorite(objectIds, true, () => {
					cb();
					analytics.event('AddToFavorites', { count: length });
				});
				break;

			case 'unfav':
				C.ObjectListSetIsFavorite(objectIds, false, () => {
					cb();
					analytics.event('RemoveFromFavorites', { count: length });
				});
				break;

			case 'unlink':
				C.ObjectCollectionRemove(targetId, objectIds, () => {
					cb();
					analytics.event('UnlinkFromCollection', { count: length });
				});
				break;

		};
		
		close();
	};

};

export default MenuContext;
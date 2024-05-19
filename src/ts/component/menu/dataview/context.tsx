import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, keyboard, analytics, translate, UtilObject, focus, Action, UtilSpace } from 'Lib';
import { detailStore, menuStore, blockStore, popupStore, commonStore } from 'Store';
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
					{item.children.map((action: any, i: number) => {
						if (action.isDiv) {
							return (
								<div key={i} className="separator">
									<div className="inner" />
								</div>
							);
						};

						return (
							<MenuItemVertical
								key={i}
								{...action}
								icon={action.icon || action.id}
								onMouseEnter={e => this.onMouseEnter(e, action)}
								onClick={e => this.onClick(e, action)}
							/>
						);
					})}
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
					<div className="item empty">{translate('menuDataviewContextNoAvailableActions')}</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};
	
	componentWillUnmount () {
		menuStore.closeAll(Constant.menuIds.object);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};
	
	getSections () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { subId, objectIds, getObject, isCollection } = data;
		const length = objectIds.length;
		const canWrite = UtilSpace.canMyParticipantWrite();

		let pageCopy = { id: 'copy', icon: 'copy', name: translate('commonDuplicate') };
		let open = { id: 'open', icon: 'expand', name: translate('commonOpenObject') };
		let linkTo = { id: 'linkTo', icon: 'linkTo', name: translate('commonLinkTo'), arrow: true };
		let changeType = { id: 'changeType', icon: 'pencil', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true };
		let createWidget = { id: 'createWidget', icon: 'createWidget', name: translate('menuBlockMoreCreateWidget') };
		let exportObject = { id: 'export', icon: 'export', name: translate('menuBlockMoreExport') };
		let unlink = { id: 'unlink', icon: 'unlink', name: translate('menuDataviewContextUnlinkFromCollection') };
		let relation = { id: 'relation', icon: 'editRelation', name: translate('menuDataviewContextEditRelations') };
		let archive = null;
		let archiveCnt = 0;
		let fav = null;
		let favCnt = 0;

		let allowedArchive = true;
		let allowedFav = true;
		let allowedCopy = true;
		let allowedType = true;
		let allowedLink = data.allowedLink;
		let allowedOpen = data.allowedOpen;
		let allowedUnlink = isCollection;
		let allowedExport = true;
		let allowedWidget = true;
		let allowedRelation = config.experimental;

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
			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Type ])) {
				allowedType = false;
			};
			if (!blockStore.isAllowed(object.restrictions, [ I.RestrictionObject.Details ])) {
				allowedRelation = false;
			};
		});

		if (favCnt == length) {
			fav = { id: 'unfav', name: translate('commonRemoveFromFavorites') };
		} else {
			fav = { id: 'fav', name: translate('commonAddToFavorites') };
		};

		if (length > 1) {
			allowedOpen = false;
			allowedLink = false;
			allowedWidget = false;
		};

		if (!canWrite) {
			allowedArchive = false;
			allowedFav = false;
			allowedCopy = false;
			allowedType = false;
			allowedLink = false;
			allowedUnlink = false;
			allowedWidget = false;
		};

		if (archiveCnt == length) {
			allowedOpen = false;
			allowedLink = false;
			allowedUnlink = false;
			allowedType = false;
			allowedFav = false;
			archive = { id: 'unarchive', icon: 'restore', name: translate('commonRestoreFromBin') };
		} else {
			archive = { id: 'archive', icon: 'remove', name: translate('commonMoveToBin') };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedFav)		 fav = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedType)		 changeType = null;
		if (!allowedLink)		 linkTo = null;
		if (!allowedOpen)		 open = null;
		if (!allowedUnlink)		 unlink = null;
		if (!allowedExport)		 exportObject = null;
		if (!allowedWidget)		 createWidget = null;
		if (!allowedRelation)	 relation = null;

		let sections = [
			{ children: [ createWidget, open, fav, linkTo, exportObject, relation ] },
			{ children: [ changeType, pageCopy, unlink, archive ] },
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
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onMouseEnter (e: any, item: any) {
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data, className, classNameWrap } = param;
		const { objectIds, onLinkTo, route } = data;

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (!item.arrow || !objectIds.length) {
			menuStore.closeAll(Constant.menuIds.object);
			return;
		};

		const itemId = objectIds[0];
		const menuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className,
			classNameWrap,
			data: {
				rebind: this.rebind,
			}
		};

		let menuId = '';
		switch (item.id) {
			case 'changeType': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					onClick: (item: any) => {
						C.ObjectListSetObjectType(objectIds, item.uniqueKey);
						analytics.event('ChangeObjectType', { objectType: item.id, count: objectIds.length, route });

						close();
					}
				});
				break;
			};

			case 'linkTo': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts().concat([ I.ObjectLayout.Collection ]) },
						{ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
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
					},
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.object, () => {
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
		const { subId, objectIds, onSelect, targetId, isCollection, route, relationKeys } = data;
		const win = $(window);
		const count = objectIds.length;
		const first = count == 1 ? detailStore.get(subId, objectIds[0], []) : null;
		const cb = () => {
			if (onSelect) {
				onSelect(item.id);
			};
		};

		focus.clear(false);

		switch (item.id) {

			case 'open': {
				UtilObject.openPopup(first);
				break;
			};

			case 'copy': {
				C.ObjectListDuplicate(objectIds, (message: any) => {
					if (message.error.code || !message.ids.length) {
						return;
					};

					if (first) {
						UtilObject.openPopup({ id: message.ids[0], layout: first.layout });
					};

					analytics.event('DuplicateObject', { count, route });

					if (isCollection) {
						C.ObjectCollectionAdd(targetId, message.ids, () => {
							cb();

							analytics.event('LinkToObject', { linkType: 'Collection', route });
						});
					} else {
						cb();
					};
				});
				break;
			};

			case 'archive': {
				Action.archive(objectIds, cb);
				win.trigger('removeGraphNode', { ids: objectIds });
				break;
			};

			case 'unarchive': {
				Action.restore(objectIds, cb);
				break;
			};

			case 'fav': {
				Action.setIsFavorite(objectIds, true, route);
				break;
			};

			case 'unfav': {
				Action.setIsFavorite(objectIds, false, route);
				break;
			};

			case 'unlink': {
				C.ObjectCollectionRemove(targetId, objectIds, () => {
					cb();
					analytics.event('UnlinkFromCollection', { count, route });
				});
				break;
			};

			case 'createWidget': {
				const firstBlock = blockStore.getFirstBlock(blockStore.widgets, 1, it => it.isWidget());

				Action.createWidgetFromObject(first.id, first.id, firstBlock?.id, I.BlockPosition.Top);
				break;
			};

			case 'export': {
				popupStore.open('export', { data: { objectIds, route } });
				break;
			};

			case 'relation': {
				popupStore.open('relation', { data: { objectIds, relationKeys, route } });
				break;
			};

		};
		
		close();
	};

};

export default MenuContext;

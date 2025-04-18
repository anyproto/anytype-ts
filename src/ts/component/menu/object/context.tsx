import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, analytics, translate, focus, Action, Preview } from 'Lib';

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
							onMouseEnter={e => this.onMouseEnter(e, action)}
							onClick={e => this.onClick(e, action)}
						/>
					))}
				</div>
			</div>
		);

		return (
			<div>
				{sections.length ? (
					<>
						{sections.map((item: any, i: number) => (
							<Section key={i} index={i} {...item} />
						))}
					</>
				) : (
					<div className="item empty">{translate('menuObjectContextNoAvailableActions')}</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};
	
	componentWillUnmount () {
		S.Menu.closeAll(J.Menu.objectContext);
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
		const { param } = this.props;
		const { data } = param;
		const { subId, getObject, isCollection } = data;
		const objectIds = this.getObjectIds();
		const length = objectIds.length;
		const canWrite = U.Space.canMyParticipantWrite();
		const exportObject = { id: 'export', icon: 'export', name: translate('menuObjectExport') };

		let pageCopy = { id: 'copy', icon: 'copy', name: translate('commonDuplicate') };
		let pageLink = { id: 'pageLink', icon: 'link', name: translate('commonCopyLink') };
		let open = { id: 'open', icon: 'expand', name: translate('commonOpenObject') };
		let linkTo = { id: 'linkTo', icon: 'linkTo', name: translate('commonLinkTo'), arrow: true };
		let addCollection = { id: 'addCollection', icon: 'collection', name: translate('commonAddToCollection'), arrow: true };
		let changeType = { id: 'changeType', icon: 'pencil', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true };
		let createWidget = { id: 'createWidget', icon: 'createWidget', name: translate('menuObjectCreateWidget') };
		let unlink = { id: 'unlink', icon: 'unlink', name: translate('menuObjectContextUnlinkFromCollection') };
		let relation = { id: 'relation', icon: 'editRelation', name: translate('menuObjectContextEditRelations') };
		let archive = null;
		let archiveCnt = 0;
		let fav = null;
		let favCnt = 0;

		let allowedArchive = true;
		let allowedFav = true;
		let allowedCopy = true;
		let allowedType = true;
		let allowedLinkTo = data.allowedLinkTo;
		let allowedOpen = data.allowedOpen;
		let allowedCollection = true;
		let allowedUnlink = isCollection;
		let allowedWidget = true;
		let allowedRelation = data.allowedRelation;
		let allowedLink = true;

		objectIds.forEach((it: string) => {
			const object = this.getObject(subId, getObject, it);

			if (!object || object._empty_) {
				return;
			};

			if (object.isFavorite) favCnt++;
			if (object.isArchived) archiveCnt++;

			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]) || object.isArchived) {
				allowedFav = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Duplicate ])) {
				allowedCopy = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Type ])) {
				allowedType = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ])) {
				allowedRelation = false;
			};
			if (U.Object.isTypeLayout(object.layout)) {
				allowedRelation = false;
			};
			if (U.Object.isRelationLayout(object.layout)) {
				allowedRelation = false;
				allowedWidget = false;
				allowedLinkTo = false;
				allowedCopy	= false;
				allowedCollection = false;
				allowedFav = false;
			};
		});

		if (favCnt == length) {
			fav = { id: 'unfav', name: translate('commonRemoveFromFavorites') };
		} else {
			fav = { id: 'fav', name: translate('commonAddToFavorites') };
		};

		if (length > 1) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedWidget = false;
			allowedLink = false;			
		};

		if (!canWrite) {
			allowedArchive = false;
			allowedFav = false;
			allowedCopy = false;
			allowedType = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedWidget = false;
			allowedRelation = false;
			allowedCollection = false;
		};

		if (archiveCnt && (archiveCnt == length)) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedType = false;
			allowedFav = false;
			allowedCollection = false;
			archive = { id: 'unarchive', icon: 'restore', name: translate('commonRestoreFromBin') };
		} else {
			archive = { id: 'archive', icon: 'remove', name: translate('commonMoveToBin') };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedFav)		 fav = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedType)		 changeType = null;
		if (!allowedLinkTo)		 linkTo = null;
		if (!allowedOpen)		 open = null;
		if (!allowedUnlink)		 unlink = null;
		if (!allowedWidget)		 createWidget = null;
		if (!allowedRelation)	 relation = null;
		if (!allowedCollection)	 addCollection = null;
		if (!allowedLink)		 pageLink = null;

		let sections = [
			{ children: [ createWidget, open, changeType, relation, pageLink ] },
			{ children: [ fav, linkTo, addCollection ] },
			{ children: [ pageCopy, exportObject, unlink, archive ] },
		];

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	getObjectIds () {
		return this.props.param.data.objectIds || [];
	};

	getObject (subId: string, getObject: (id: string) => any, id: string) {
		return getObject ? getObject(id) : S.Detail.get(subId, id);
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
		const { id, param, getId, getSize, close } = this.props;
		const { data, className, classNameWrap } = param;
		const { onLinkTo, route } = data;
		const objectIds = this.getObjectIds();

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (!item.arrow || !objectIds.length) {
			S.Menu.closeAll(J.Menu.objectContext);
			return;
		};

		const itemId = objectIds[0];
		const menuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			noAutoHover: true,
			className,
			classNameWrap,
			rebind: this.rebind,
			parentId: id,
			data: {},
		};

		let menuId = '';
		switch (item.id) {
			case 'changeType': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
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
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
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
							onLinkTo(el.id, itemId);
						};

						close();
					},
				});
				break;
			};

			case 'addCollection': {
				const collectionType = S.Record.getCollectionType();

				menuId = 'searchObject';
				menuParam.className = 'single';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Collection },
						{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					rootId: itemId,
					blockId: itemId,
					blockIds: [ itemId ],
					skipIds: [ itemId ],
					canAdd: true,
					addParam: {
						name: translate('blockDataviewCreateNewCollection'),
						nameWithFilter: translate('blockDataviewCreateNewCollectionWithName'),
						onClick: (details: any) => {
							C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, true, message => {
								Action.addToCollection(message.objectId, objectIds);
								U.Object.openAuto(message.details);
							});
						},
					},
					onSelect: (el: any) => {
						Action.addToCollection(el.id, objectIds);

						if (onLinkTo) {
							onLinkTo(el.id, itemId);
						};

						close();
					},
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id) && !S.Menu.isAnimating(menuId)) {
			S.Menu.closeAll(J.Menu.objectContext, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onClick (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { subId, getObject, onSelect, targetId, isCollection, route, relationKeys, view, blockId } = data;
		const objectIds = this.getObjectIds();
		const win = $(window);
		const length = objectIds.length;
		const first = length == 1 ? this.getObject(subId, getObject, objectIds[0]) : null;
		const cb = () => {
			if (onSelect) {
				onSelect(item.id);
			};
		};

		focus.clear(false);

		switch (item.id) {

			case 'open': {
				U.Object.openConfig(first);
				break;
			};

			case 'copy': {
				C.ObjectListDuplicate(objectIds, (message: any) => {
					if (message.error.code || !message.ids.length) {
						return;
					};

					if (first) {
						U.Object.openConfig({ id: message.ids[0], layout: first.layout });
					};

					analytics.event('DuplicateObject', { count: length, route });

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

			case 'pageLink': {
				if (!first) {
					break;
				};

				U.Common.clipboardCopy({ text: `${J.Constant.protocol}://${U.Object.universalRoute(first)}` });
				analytics.event('CopyLink', { route });
				break;
			};

			case 'archive': {
				Action.archive(objectIds, route, cb);
				win.trigger('removeGraphNode', { ids: objectIds });
				break;
			};

			case 'unarchive': {
				Action.restore(objectIds, route, cb);
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
					analytics.event('UnlinkFromCollection', { count: length, route });
				});
				break;
			};

			case 'createWidget': {
				if (!first) {
					break;
				};

				const firstBlock = S.Block.getFirstBlock(S.Block.widgets, 1, it => it.isWidget());

				Action.createWidgetFromObject(first.id, first.id, firstBlock?.id, I.BlockPosition.Top, analytics.route.addWidgetMenu);
				break;
			};

			case 'export': {
				S.Popup.open('export', { data: { objectIds, route } });
				break;
			};

			case 'relation': {
				S.Popup.open('relation', { data: { objectIds, relationKeys, route, view, targetId, blockId } });
				break;
			};

		};
		
		close();
	};

};

export default MenuContext;

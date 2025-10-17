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
		let unlink = { id: 'unlink', icon: 'unlink', name: translate('menuObjectContextUnlinkFromCollection') };
		let relation = { id: 'relation', icon: 'editRelation', name: translate('menuObjectContextEditRelations') };
		let archive = null;
		let archiveCnt = 0;
		let pin = null;
		let pinCnt = 0;

		let allowedArchive = true;
		let allowedPin = true;
		let allowedCopy = true;
		let allowedType = true;
		let allowedLinkTo = data.allowedLinkTo;
		let allowedOpen = data.allowedOpen;
		let allowedCollection = true;
		let allowedUnlink = isCollection;
		let allowedRelation = data.allowedRelation;
		let allowedLink = true;

		objectIds.forEach((it: string) => {
			const object = this.getObject(subId, getObject, it);

			if (!object || object._empty_) {
				return;
			};

			if (S.Block.getWidgetsForTarget(object.id, I.WidgetSection.Pin).length) pinCnt++;
			if (object.isArchived) archiveCnt++;

			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]) || object.isArchived || U.Object.isTemplateType(object.type)) {
				allowedPin = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Duplicate ])) {
				allowedCopy = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Type, I.RestrictionObject.Layout ])) {
				allowedType = false;
			};
			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ])) {
				allowedRelation = false;
			};
			if (U.Object.isTypeLayout(object.layout)) {
				allowedRelation = false;
				allowedCopy	= false;
			};
			if (U.Object.isRelationLayout(object.layout)) {
				allowedRelation = false;
				allowedLinkTo = false;
				allowedCopy	= false;
				allowedCollection = false;
				allowedPin = false;
			};
		});

		if (pinCnt == length) {
			pin = { id: 'unpin', name: translate('commonUnpin') };
		} else {
			pin = { id: 'pin', name: translate('commonPin') };
		};

		if (length > 1) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedLink = false;
			allowedPin = false;		
		};

		if (!canWrite) {
			allowedArchive = false;
			allowedPin = false;
			allowedCopy = false;
			allowedType = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedRelation = false;
			allowedCollection = false;
		};

		if (archiveCnt && (archiveCnt == length)) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedType = false;
			allowedPin = false;
			allowedCollection = false;
			archive = { id: 'unarchive', icon: 'restore', name: translate('commonRestoreFromBin') };
		} else {
			archive = { id: 'archive', icon: 'remove', name: translate('commonMoveToBin') };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedPin)		 pin = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedType)		 changeType = null;
		if (!allowedLinkTo)		 linkTo = null;
		if (!allowedOpen)		 open = null;
		if (!allowedUnlink)		 unlink = null;
		if (!allowedRelation)	 relation = null;
		if (!allowedCollection)	 addCollection = null;
		if (!allowedLink)		 pageLink = null;

		let sections = [
			{ children: [ open, changeType, relation, pageLink ] },
			{ children: [ pin, linkTo, addCollection ] },
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
					canAdd: true,
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
				menuParam.className = [ 'single', className ].join(' ');
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
							C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, message => {
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

		const { widgets } = S.Block;
		const { param, close } = this.props;
		const { data } = param;
		const { subId, getObject, onSelect, targetId, isCollection, route, relationKeys, view, blockId } = data;
		const objectIds = this.getObjectIds();
		const space = U.Space.getSpaceview();
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
				U.Object.copyLink(first, space, 'web', route);
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

			case 'pin': {
				Action.createWidgetFromObject(subId, first.id, '', I.BlockPosition.InnerFirst, route);
				break;
			};

			case 'unpin': {
				Action.removeWidgetsForObjects([ first.id ]);
				break;
			};

			case 'unlink': {
				C.ObjectCollectionRemove(targetId, objectIds, () => {
					cb();
					analytics.event('UnlinkFromCollection', { count: length, route });
				});
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

import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, analytics, translate, focus, Action } from 'Lib';

const LIMIT_OPEN = 10;

const MenuObjectContext = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, getId, getSize, close } = props;
	const { data, className, classNameWrap } = param;
	const { 
		subId, getObject, isCollection, onLinkTo, route, onSelect, targetId, relationKeys, view, blockId, 
	} = data;
	const objectIds = data.objectIds || [];
	const { space } = S.Common;
	const spaceview = U.Space.getSpaceview();
	const participantId = U.Space.getCurrentParticipantId();
	const n = useRef(0);

	useEffect(() => {
		rebind();

		return () => {
			S.Menu.closeAll(J.Menu.objectContext);
			unbind();
		};
	}, []);
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};
	
	const getSections = () => {
		const length = objectIds.length;
		const canWrite = U.Space.canMyParticipantWrite();

		let pageCopy = { id: 'copy', icon: 'copy', name: translate('commonDuplicate') };
		let pageLink = { id: 'pageLink', icon: 'link', name: translate('commonCopyLink') };
		let open = { id: 'open', icon: 'expand', name: translate('commonOpenObject') };
		let linkTo = { id: 'linkTo', icon: 'linkTo', name: translate('commonLinkTo'), arrow: true };
		let addCollection = { id: 'addCollection', icon: 'collection', name: translate('commonAddToCollection'), arrow: true };
		let changeType = { id: 'changeType', icon: 'pencil', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true };
		let unlink = { id: 'unlink', icon: 'unlink', name: translate('menuObjectContextUnlinkFromCollection') };
		let relation = { id: 'relation', icon: 'editRelation', name: translate('menuObjectContextEditRelations') };
		let notification = { id: 'notification', icon: 'notification', name: translate('commonNotifications'), arrow: true };
		let editChat = { id: 'editChat', name: translate('commonEditChat'), icon: 'editChat' };
		let exportObject = { id: 'export', icon: 'export', name: translate('menuObjectExport') };
		let newTab = { id: 'newTab', icon: 'newTab', name: translate('menuObjectOpenInNewTab') };
		let newWindow = { id: 'newWindow', icon: 'newWindow', name: translate('menuObjectOpenInNewWindow') };
		let archive = null;
		let archiveCnt = 0;
		let pin = null;
		let pinCnt = 0;

		let allowedArchive = true;
		let allowedPin = true;
		let allowedCopy = true;
		let allowedType = data.allowedType;
		let allowedLinkTo = data.allowedLinkTo;
		let allowedOpen = data.allowedOpen;
		let allowedCollection = data.allowedCollection;
		let allowedUnlink = isCollection;
		let allowedRelation = data.allowedRelation;
		let allowedLink = true;
		let allowedNotification = true;
		let allowedEditChat = true;
		let allowedExport = data.allowedExport;
		let allowedNewTab = data.allowedNewTab;

		objectIds.forEach((it: string) => {
			const object = getObjectHandler(subId, getObject, it);

			if (!object || object._empty_) {
				return;
			};

			const isType = U.Object.isTypeLayout(object.layout);
			const isRelation = U.Object.isRelationLayout(object.layout);
			const isChat = U.Object.isChatLayout(object.layout);

			if (S.Block.getWidgetsForTarget(object.id).length) pinCnt++;
			if (object.isArchived) archiveCnt++;

			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (spaceview.isOneToOne && (object.creator != participantId)) {
				allowedArchive = false;
			};

			if (object.isArchived || U.Object.isTemplateType(object.type)) {
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

			if (isType) {
				allowedRelation = false;
				allowedCopy	= false;
				allowedType = false;
			};

			if (isRelation) {
				allowedRelation = false;
				allowedLinkTo = false;
				allowedCopy	= false;
				allowedCollection = false;
				allowedPin = false;
			};

			if (!isChat) {
				allowedNotification = false;
				allowedEditChat = false;
			} else {
				allowedExport = false;
				allowedCollection = false;
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
			allowedEditChat = false;
		};

		if (length > LIMIT_OPEN) {
			allowedNewTab = false;
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
			allowedNotification = false;
			allowedEditChat = false;
		};

		if (archiveCnt && (archiveCnt == length)) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedType = false;
			allowedPin = false;
			allowedCollection = false;
			allowedNotification = false;
			allowedEditChat = false;
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
		if (!allowedNotification) notification = null;
		if (!allowedEditChat)	 editChat = null;
		if (!allowedExport)		 exportObject = null;
		if (!allowedNewTab) {
			newTab = null;
			newWindow = null;
		};

		let sections = [
			{ children: [ open, changeType, relation, pageLink ] },
			{ children: [ pin, notification, editChat, linkTo, addCollection ] },
			{ children: [ pageCopy, exportObject, unlink, archive ] },
			{ children: [ newTab, newWindow ] },
		];

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};

	const getObjectHandler = (subId: string, getObject: (id: string) => any, id: string) => {
		return getObject ? getObject(id) : S.Detail.get(subId, id);
	};
	
	const getItems = () => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
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
			rebind,
			parentId: props.id,
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

			case 'notification': {
				let value = null;

				if (objectIds.length == 1) {
					value = String(U.Object.getChatNotificationMode(U.Space.getSpaceview(), objectIds[0])) || '';
				};

				menuId = 'select';
				menuParam.data = {
					value,
					options: U.Menu.notificationModeOptions(),
					onSelect: (e, option) => {
						Action.setChatNotificationMode(space, objectIds, Number(option.id), route);
						close();
					},
				};
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id) && !S.Menu.isAnimating(menuId)) {
			S.Menu.closeAll(J.Menu.objectContext, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: any, item: any) => {
		if (item.arrow) {
			return;
		};

		const win = $(window);
		const length = objectIds.length;
		const first = length == 1 ? getObjectHandler(subId, getObject, objectIds[0]) : null;
		const cb = () => onSelect?.(item.id);

		focus.clear(false);

		let needClose = true;

		switch (item.id) {

			case 'open': {
				U.Object.openConfig(null, first);
				break;
			};

			case 'copy': {
				C.ObjectListDuplicate(objectIds, (message: any) => {
					if (message.error.code || !message.ids.length) {
						return;
					};

					if (first) {
						U.Object.openConfig(null, { id: message.ids[0], layout: first.layout });
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
				U.Object.copyLink(first, spaceview, 'web', route);
				break;
			};

			case 'archive': {
				Action.archiveCheckType(subId, objectIds, route);
				win.trigger('archiveObject', { ids: objectIds });
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

			case 'editChat': {
				U.Menu.onChatMenu({
					element: `#${getId()} #item-${item.id}`,
					className,
					classNameWrap,
					offsetX: getSize().width,
					vertical: I.MenuDirection.Center,
					data: {
						details: first,
					},
				}, route);

				needClose = false;
				break;
			};

			case 'newTab':
			case 'newWindow': {
				const slice = objectIds.slice(0, LIMIT_OPEN);
				const objects = slice.map(id => getObjectHandler(subId, getObject, id)).filter(it => it);

				if (item.id == 'newTab') {
					U.Object.openTabs(objects);
				} else {
					U.Object.openWindows(objects, S.Auth.token);
				};
				break;
			};

		};
		
		if (needClose) {
			close();
		};
	};
	
	const sections = getSections();

	const Section = (item: any) => (
		<div id={`section-${item.id}`} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...action}
						icon={action.icon || action.id}
						onMouseEnter={e => onMouseEnter(e, action)}
						onClick={e => onClick(e, action)}
					/>
				))}
			</div>
		</div>
	);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), []);

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
	
}));

export default MenuObjectContext;
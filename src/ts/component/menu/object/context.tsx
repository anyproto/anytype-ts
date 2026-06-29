import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { MenuItemVertical } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const LIMIT_OPEN = 10;

const MenuObjectContext = forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
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
		U.Dom.addEvent(window, 'keydown', onKeyDown);
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};
	
	const getSections = () => {
		const length = objectIds.length;
		const canWrite = U.Space.canMyParticipantWrite();

		let pageCopy = { id: 'copy', iconParam: { name: 'menu/action/duplicate' }, name: translate('commonDuplicate') };
		let pageLink = { id: 'pageLink', iconParam: { name: 'menu/action/pageLink' }, name: translate('commonCopyLink') };
		let open = { id: 'open', iconParam: { name: 'common/expand' }, name: translate('commonOpenObject') };
		let linkTo = { id: 'linkTo', iconParam: { name: 'menu/block/common/linkto' }, name: translate('commonLinkTo'), arrow: true };
		let addCollection = { id: 'addCollection', iconParam: { name: 'menu/action/collection' }, name: translate('commonAddToCollection'), arrow: true };
		let changeType = { id: 'changeType', iconParam: { name: 'common/edit' }, name: translate('blockFeaturedTypeMenuChangeType'), arrow: true };
		let unlink = { id: 'unlink', iconParam: { name: 'common/unlink' }, name: translate('menuObjectContextUnlinkFromCollection') };
		let relation = { id: 'relation', iconParam: { name: 'header/relation' }, name: translate('menuObjectContextEditRelations') };
		let notification: any = { id: 'notification', iconParam: { name: 'menu/action/notification' }, name: translate('commonNotifications'), arrow: true };
		let editChat = { id: 'editChat', name: translate('commonEditChat'), iconParam: { name: 'common/edit' } };
		let exportObject = { id: 'export', iconParam: { name: 'menu/action/export' }, name: translate('menuObjectExport') };
		let newTab = { id: 'newTab', iconParam: { name: 'menu/action/newTab' }, name: translate('menuObjectOpenInNewTab') };
		let newWindow = { id: 'newWindow', iconParam: { name: 'menu/action/newWindow' }, name: translate('menuObjectOpenInNewWindow') };
		let archive = null;
		let archiveCnt = 0;
		let pin = null;
		let pinCnt = 0;
		let fav = null;
		let favCnt = 0;

		let allowedArchive = true;
		let allowedPin = true;
		let allowedFav = true;
		let allowedCopy = true;
		let allowedType = data.allowedType;
		let allowedLinkTo = data.allowedLinkTo;
		let allowedOpen = data.allowedOpen;
		let allowedCollection = data.allowedCollection;
		let allowedUnlink = isCollection;
		let allowedRelation = data.allowedRelation;
		let allowedLink = true;
		let allowedNotification = false;
		let allowedEditChat = false;
		let allowedExport = data.allowedExport;
		let allowedNewTab = data.allowedNewTab;

		const personalWidgetsId = U.Object.getPersonalWidgetsId();

		objectIds.forEach((it: string) => {
			if (S.Block.getWidgetsForTarget(it).length) pinCnt++;
			if (S.Block.getWidgetsForTargetIn(it, personalWidgetsId).length) favCnt++;

			const object = getObjectHandler(subId, getObject, it);

			if (!object || object._empty_) {
				return;
			};

			const isType = U.Object.isTypeLayout(object.layout);
			const isRelation = U.Object.isRelationLayout(object.layout);
			const isChat = U.Object.isChatLayout(object.layout);

			if (object.isArchived) archiveCnt++;

			if (!S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Delete ])) {
				allowedArchive = false;
			};
			if (spaceview.isOneToOne && (object.creator != participantId)) {
				allowedArchive = false;
			};

			if (object.isArchived || U.Object.isTemplateType(object.type)) {
				allowedPin = false;
				allowedFav = false;
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
				allowedFav = false;
			};

			allowedNotification = allowedNotification && isChat;
			allowedEditChat = allowedEditChat && isChat;
			allowedExport = allowedExport && !isChat;
			allowedCollection = allowedCollection && !isChat;
		});

		if (pinCnt == length) {
			pin = { id: 'unpinFromChannel', iconParam: { name: 'menu/action/pin' }, name: translate('menuWidgetUnpinFromChannel') };
		} else {
			pin = { id: 'pinToChannel', iconParam: { name: 'menu/action/pin' }, name: translate('menuWidgetPinToChannel') };
		};

		if (favCnt == length) {
			fav = { id: 'unfavorite', iconParam: { name: 'menu/action/unfav' }, name: translate('menuWidgetUnfavorite') };
		} else {
			fav = { id: 'favorite', iconParam: { name: 'menu/action/fav' }, name: translate('menuWidgetFavorite') };
		};

		if (length > 1) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedLink = false;
			allowedPin = false;
			allowedFav = false;
			allowedEditChat = false;
		};

		if (length > LIMIT_OPEN) {
			allowedNewTab = false;
		};

		if (!canWrite) {
			allowedArchive = false;
			allowedPin = false;
			allowedFav = false;
			allowedCopy = false;
			allowedType = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedRelation = false;
			allowedCollection = false;
			allowedNotification = false;
			allowedEditChat = false;
		};

		if (!U.Space.canMyParticipantModerate()) {
			allowedPin = false;
		};

		if (archiveCnt && (archiveCnt == length)) {
			allowedOpen = false;
			allowedLinkTo = false;
			allowedUnlink = false;
			allowedType = false;
			allowedPin = false;
			allowedFav = false;
			allowedCollection = false;
			allowedNotification = false;
			allowedEditChat = false;
			archive = { id: 'unarchive', iconParam: { name: 'menu/action/restore' }, name: translate('commonRestoreFromBin') };
		} else {
			archive = { id: 'archive', iconParam: { name: 'menu/action/remove' }, name: translate('commonMoveToBin') };
		};

		if (!allowedArchive)	 archive = null;
		if (!allowedPin)		 pin = null;
		if (!allowedFav)		 fav = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedType)		 changeType = null;
		if (!allowedLinkTo)		 linkTo = null;
		if (!allowedCollection)	 addCollection = null;
		if (!allowedOpen)		 open = null;
		if (!allowedUnlink)		 unlink = null;
		if (!allowedRelation)	 relation = null;
		if (!allowedLink)		 pageLink = null;
		if (!allowedNotification) {
			notification = null;
		} else
		if (spaceview.isOneToOne) {
			const chatMode = (objectIds.length == 1) ? U.Object.getChatNotificationMode(spaceview, objectIds[0]) : I.NotificationMode.All;
			const isMuted = chatMode != I.NotificationMode.All;

			if (isMuted) {
				notification = { id: 'unmute', name: translate('commonUnmute'), iconParam: { name: 'menu/action/unmute' } };
			} else {
				notification = { id: 'mute', name: translate('commonMute'), iconParam: { name: 'menu/action/mute' } };
			};
		};
		if (!allowedEditChat)	 editChat = null;
		if (!allowedExport)		 exportObject = null;
		if (!allowedNewTab) {
			newTab = null;
			newWindow = null;
		};

		let sections = [
			{ children: [ open, changeType, relation ] },
			{ children: [ fav, pin, notification, editChat, linkTo, addCollection ] },
			{ children: [ pageLink, pageCopy, exportObject, unlink, archive ] },
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
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
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
						{ relationKey: 'links', condition: I.FilterCondition.NotIn, value: [ itemId ] },
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
						{ relationKey: 'links', condition: I.FilterCondition.NotIn, value: [ itemId ] },
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

					if (data.openAfterDuplicate && first) {
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
				U.Dom.eventDispatch(window, 'archiveObject', { ids: objectIds });
				break;
			};

			case 'unarchive': {
				Action.restore(objectIds, route, cb);
				break;
			};

			case 'pinToChannel':
			case 'unpinFromChannel': {
				Action.toggleWidgetsForObject(first.id, route);
				break;
			};

			case 'favorite':
			case 'unfavorite': {
				Action.togglePersonalWidgetsForObject(first.id, route);
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
					element: `#${getId()} #item-${U.Common.esc(item.id)}`,
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
					U.Object.openTabs(objects, route);
				} else {
					U.Object.openWindows(objects, S.Auth.token);
				};
				break;
			};

			case 'mute':
			case 'unmute': {
				let mode = I.NotificationMode.All;
				if (item.id == 'mute') {
					mode = spaceview.isOneToOne ? I.NotificationMode.Nothing : I.NotificationMode.Mentions;
				};
				Action.setChatNotificationMode(space, objectIds, mode, route);
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
	
});

export default MenuObjectContext;

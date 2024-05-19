import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, keyboard, analytics, UtilData, UtilObject, UtilCommon, Preview, focus, Action, translate, UtilSpace } from 'Lib';
import { blockStore, detailStore, commonStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

class MenuObject extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const { config } = commonStore;
		const sections = this.getSections();
		const restrictions = blockStore.getRestrictions(rootId, rootId).map(it => I.RestrictionObject[it]);

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
								onMouseEnter={e => this.onMouseEnter(e, action)} 
								onClick={e => this.onClick(e, action)} 
							/>
						);
					})}
				</div>
			</div>
		);

		let sectionPage = null;
		if (block && block.isPage() && config.sudo && restrictions.length) {
			sectionPage = (
				<React.Fragment>
					<div className="section">
						<div className="name">Restrictions</div>
						<div className="items">
							{restrictions.map((item: any, i: number) => (
								<div className="item" key={i}>{item || 'Empty'}</div>
							))}
						</div>
					</div>
				</React.Fragment>
			);
		};

		return (
			<div>
				{sectionPage}
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
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return [];
		};
		
		const object = detailStore.get(rootId, blockId);
		const cmd = keyboard.cmdSymbol();
		const isTemplate = UtilObject.isTemplate(object.type);
		const print = { id: 'print', name: translate('menuBlockMorePrint'), caption: `${cmd} + P` };
		const pageExport = { id: 'pageExport', icon: 'export', name: translate('menuBlockMoreExport') };
		const canWrite = UtilSpace.canMyParticipantWrite();
		const canDelete = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Delete ]);

		let archive = null;
		let remove = null;
		let fav = null;
		let pageLock = null;
		let pageInstall = null;
		let template = null;
		let setDefaultTemplate = null;

		let linkTo = { id: 'linkTo', icon: 'linkTo', name: translate('commonLinkTo'), arrow: true };
		let search = { id: 'search', name: translate('menuBlockMoreSearchOnPage'), caption: `${cmd} + F` };
		let history = { id: 'history', name: translate('menuBlockMoreVersionHistory'), caption: (UtilCommon.isPlatformMac() ? `${cmd} + Y` : `Ctrl + H`) };
		let pageCopy = { id: 'pageCopy', icon: 'copy', name: translate('commonDuplicate') };
		let pageLink = { id: 'pageLink', icon: 'link', name: translate('commonCopyLink') };
		let pageReload = { id: 'pageReload', icon: 'reload', name: translate('menuBlockMoreReloadFromSource') };
		let createWidget = { id: 'createWidget', icon: 'createWidget', name: translate('menuBlockMoreCreateWidget') };

		if (isTemplate) {	
			template = { id: 'pageCreate', icon: 'template', name: translate('menuBlockMoreCreateObject') };
			setDefaultTemplate = { id: 'setDefault', icon: 'pin', name: translate('menuBlockMoreSetDefaultTemplate') };
			pageCopy.name = translate('commonDuplicate');
		} else {
			template = { id: 'templateCreate', icon: 'template', name: translate('menuBlockMoreUseAsTemplate') };
		};

		if (object.isFavorite) {
			fav = { id: 'unfav', name: translate('commonRemoveFromFavorites') };
		} else {
			fav = { id: 'fav', name: translate('commonAddToFavorites') };
		};

		if (object.isArchived) {
			linkTo = null;
			remove = { id: 'pageRemove', icon: 'remove', name: translate('commonDeleteImmediately') };
			archive = { id: 'pageUnarchive', icon: 'restore', name: translate('commonRestoreFromBin') };
		} else {
			archive = { id: 'pageArchive', icon: 'remove', name: translate('commonMoveToBin') };
		};

		if (block.isLocked()) {
			pageLock = { id: 'pageUnlock', icon: 'pageUnlock', name: translate('menuBlockMoreUnlockPage'), caption: `Ctrl + Shift + L` };
		} else {
			pageLock = { id: 'pageLock', icon: 'pageLock', name: translate('menuBlockMoreLockPage'), caption: `Ctrl + Shift + L` };
		};

		if (object.isInstalled) {
			pageInstall = { id: 'pageUninstall', icon: 'remove', name: translate('commonDelete') };
		} else {
			pageInstall = { id: 'pageInstall', icon: 'install', name: translate('menuBlockMoreInstall') };
		};

		// Restrictions

		const allowedArchive = canWrite && canDelete;
		const allowedSearch = !UtilObject.isSetLayout(object.layout);
		const allowedHistory = !UtilObject.isFileOrSystemLayout(object.layout) && !UtilObject.isSetLayout(object.layout) && !block.isObjectParticipant() && !object.templateIsBundled;
		const allowedFav = canWrite && !object.isArchived && !UtilObject.isFileOrSystemLayout(object.layout) && !object.templateIsBundled;
		const allowedLock = canWrite && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedLinkTo = canWrite;
		const allowedPageLink = true;
		const allowedCopy = canWrite && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Duplicate ]);
		const allowedReload = canWrite && object.source && block.isObjectBookmark();
		const allowedInstall = canWrite && !object.isInstalled && UtilObject.isTypeOrRelationLayout(object.layout);
		const allowedUninstall = canWrite && object.isInstalled && UtilObject.isTypeOrRelationLayout(object.layout) && canDelete;
		const allowedTemplate = canWrite && !UtilObject.getLayoutsWithoutTemplates().includes(object.layout) && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Template ]);
		const allowedWidget = canWrite;
		const hasShortMenu = (
			block.isObjectType() || 
			block.isObjectRelation() || 
			block.isObjectFileKind() || 
			block.isObjectSet() || 
			block.isObjectCollection()
		);

		if (!allowedArchive)	 archive = null;
		if (!allowedLock)		 pageLock = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedReload)		 pageReload = null;
		if (!allowedSearch)		 search = null;
		if (!allowedHistory)	 history = null;
		if (!allowedFav)		 fav = null;
		if (!allowedInstall && !allowedUninstall)	 pageInstall = null;
		if (!isTemplate && !allowedTemplate)	 template = null;
		if (allowedUninstall)	 archive = null;
		if (!allowedWidget)		 createWidget = null;
		if (!allowedLinkTo)		 linkTo = null;
		if (!allowedPageLink)	 pageLink = null;

		if (!canWrite) {
			template = null;
			setDefaultTemplate = null;
		};

		let sections = [];
		if (hasShortMenu) {
			if (!UtilObject.isSetLayout(object.layout)) {
				pageCopy = null;
			};

			sections = [
				{ children: [ createWidget, fav, pageLock ] },
				{ children: [ linkTo ] },
				{ children: [ search, pageLink, pageInstall, pageCopy, archive, remove ] },
				{ children: [ print ] },
			];
		} else {
			if (isTemplate) {
				sections = [
					{ children: [ search, template, pageCopy, setDefaultTemplate, pageExport, archive, history ] },
					{ children: [ print ] },
				];
			} else
			if (object.isArchived) {
				sections = [
					{ children: [ search, pageExport, remove, archive ] },
					{ children: [ print ] },
				];
			} else {
				sections = [
					{ children: [ createWidget, fav, pageLock ] },
					{ children: [ linkTo, template ] },
					{ children: [ search, history, pageCopy, archive ] },
					{ children: [ pageLink, pageReload ] },
					{ children: [ print, pageExport ] },
				];
			};

			sections = sections.map((it: any, i: number) => ({ ...it, id: 'page' + i }));
		};

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
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.object);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			data: {
				rebind: this.rebind,
				rootId,
				blockId: rootId,
				blockIds: [ blockId ],
			},
		};

		let menuId = '';
		switch (item.id) {
			case 'linkTo': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.LinkTo,
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts().concat([ I.ObjectLayout.Collection ]) },
						{ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					onSelect: () => close(),
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
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
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const object = detailStore.get(rootId, rootId);
		const route = analytics.route.menuObject;
		
		if (!block || item.arrow) {
			return;
		};
		
		const close = true;
		
		if (onSelect) {
			onSelect(item);
		};

		const onBack = () => {
			if (!block.isPage()) {
				return;
			};

			const home = UtilSpace.getDashboard();
			if (home && (object.id == home.id)) {
				UtilObject.openRoute({ layout: I.ObjectLayout.Empty });
			} else {
				keyboard.onBack();
			};
		};

		focus.clear(false);
		
		switch (item.id) {
				
			case 'print': {
				keyboard.onPrint(route);
				break;
			};

			case 'history': {
				keyboard.disableClose(true);
				UtilObject.openAuto({ layout: I.ObjectLayout.History, id: object.id });
				break;
			};
			
			case 'search': {
				keyboard.onSearchMenu('', route);
				break;
			};

			case 'pageCopy': {
				C.ObjectListDuplicate([ rootId ], (message: any) => {
					if (!message.error.code && message.ids.length) {
						UtilObject.openPopup({ id: message.ids[0], layout: object.layout }, {
							onClose: () => $(window).trigger(`updatePreviewObject.${message.ids[0]}`)
						});

						analytics.event('DuplicateObject', { count: 1, route, objectType: object.type });
					};
				});
				break;
			};

			case 'pageExport': {
				popupStore.open('export', { data: { objectIds: [ rootId ], allowHtml: true, route } });
				break;
			};
				
			case 'pageArchive': {
				Action.archive([ object.id ], () => onBack());
				break;
			};

			case 'pageUnarchive': {
				Action.restore([ object.id ]);
				break;
			};

			case 'pageRemove': {
				Action.delete([ object.id ], route, () => onBack());
				break;
			};

			case 'pageLock': {
				keyboard.onLock(rootId, true, route);
				break;
			};

			case 'pageUnlock': {
				keyboard.onLock(rootId, false, route);
				break;
			};

			case 'pageCreate': {
				UtilObject.create('', '', { type: object.targetObjectType }, I.BlockPosition.Bottom, rootId, [], route, message => UtilObject.openAuto(message.details));
				break;
			};

			case 'pageLink': {
				UtilCommon.clipboardCopy({ text: Url.protocol + UtilObject.universalRoute(object) });
				analytics.event('CopyLink', { route });
				break;
			};

			case 'pageReload': {
				C.ObjectBookmarkFetch(rootId, object.source, () => {
					analytics.event('ReloadSourceData', { route });
				});
				break;
			};

			case 'pageInstall': {
				Action.install(object, false, (message: any) => {
					UtilObject.openAuto(message.details);
				});
				break;
			};

			case 'pageUninstall': {
				Action.uninstall(object, false, '', () => onBack());
				break;
			};

			case 'fav': {
				Action.setIsFavorite([ rootId ], true, route);
				break;
			};

			case 'unfav': {
				Action.setIsFavorite([ rootId ], false, route);
				break;
			};

			case 'templateCreate': {
				C.TemplateCreateFromObject(rootId, (message: any) => {
					UtilObject.openPopup({ id: message.id, layout: object.layout });
					Preview.toastShow({ action: I.ToastAction.TemplateCreate, objectId: rootId });

					analytics.event('CreateTemplate', { objectType: object.type, route });
				});
				break;
			};

			case 'setDefault': {
				UtilObject.setDefaultTemplateId(object.targetObjectType, rootId);
				Preview.toastShow({ text: translate('toastSetDefaultTemplate') });
				analytics.event('ChangeDefaultTemplate', { route });
				break;
			};

			case 'createWidget': {
				const first = blockStore.getFirstBlock(blockStore.widgets, 1, it => it.isWidget());

				Action.createWidgetFromObject(rootId, rootId, first?.id, I.BlockPosition.Top);
				break;
			};
		};
		
		if (close) {
			this.props.close();
		};
	};

};

export default MenuObject;

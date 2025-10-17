import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, S, U, J, keyboard, analytics, Preview, focus, Action, translate, sidebar } from 'Lib';

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
		const block = S.Block.getLeaf(rootId, blockId);
		const { config } = S.Common;
		const sections = this.getSections();
		const restrictions = S.Block.getRestrictions(rootId, rootId).map(it => I.RestrictionObject[it]);

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
		if (block && block.isPage() && config.sudo && config.debug.ui && restrictions.length) {
			sectionPage = (
				<>
					<div className="section">
						<div className="name">Restrictions</div>
						<div className="items">
							{restrictions.map((item: any, i: number) => (
								<div className="item" key={i}>{item || 'Empty'}</div>
							))}
						</div>
					</div>
				</>
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
		S.Menu.closeAll(J.Menu.object);
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
		const { blockId, rootId, isFilePreview } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		const object = this.getObject();
		const isTemplate = U.Object.isTemplateType(object.type);
		const isDate = U.Object.isDateLayout(object.layout);
		const isChat = U.Object.isChatLayout(object.layout);
		const isBookmark = U.Object.isBookmarkLayout(object.layout);
		const isParticipant = U.Object.isParticipantLayout(object.layout);
		const isInSet = U.Object.isInSetLayouts(object.layout);
		const isInFile = U.Object.isInFileLayouts(object.layout);
		const isInFileOrSystem = U.Object.isInFileOrSystemLayouts(object.layout);
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const isRelation = U.Object.isRelationLayout(object.layout);
		const isType = U.Object.isTypeLayout(object.layout);
		const canWrite = U.Space.canMyParticipantWrite();
		const canDelete = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Delete ]);

		let archive = null;
		let remove = null;
		let pageLock = null;
		let template = null;
		let setDefaultTemplate = null;
		let advancedOptions = [];

		let print = { id: 'print', name: translate('menuObjectPrint'), caption: keyboard.getCaption('print') };
		let linkTo = { id: 'linkTo', icon: 'linkTo', name: translate('commonLinkTo'), arrow: true };
		let addCollection = { id: 'addCollection', icon: 'collection', name: translate('commonAddToCollection'), arrow: true };
		let search = { id: 'search', name: translate('menuObjectSearchOnPage'), caption: keyboard.getCaption('searchText') };
		let history = { id: 'history', name: translate('commonVersionHistory'), caption: keyboard.getCaption('history') };
		let pageCopy = { id: 'pageCopy', icon: 'copy', name: translate('commonDuplicate') };
		let pageLink = { id: 'pageLink', icon: 'linkTo', name: translate('commonCopyLink') };
		let pageDeeplink = { id: 'pageDeeplink', icon: 'linkTo', name: translate('commonCopyDeeplink') };
		let pageReload = { id: 'pageReload', icon: 'reload', name: translate('menuObjectReloadFromSource') };
		let pageExport = { id: 'pageExport', icon: 'export', name: translate('menuObjectExport') };
		let downloadFile = { id: 'downloadFile', icon: 'download', name: translate('commonDownload') };
		let openFile = { id: 'openFile', icon: 'expand', name: translate('menuObjectDownloadOpen') };
		let openObject = { id: 'openAsObject', icon: 'expand', name: translate('commonOpenObject') };
		let advanced = { id: 'advanced', icon: 'advanced', name: translate('menuObjectAdvanced'), children:[], arrow: true };
		let editType = { id: 'editType', name: translate('commonEditType'), icon: 'editType' };
		let editChat = { id: 'editChat', name: translate('commonEditChat'), icon: 'editChat' };

		if (isTemplate) {	
			template = { id: 'pageCreate', icon: 'template', name: translate('commonCreateObject') };
			setDefaultTemplate = { id: 'setDefault', icon: 'pin', name: translate('menuObjectSetDefaultTemplate') };
			pageCopy.name = translate('commonDuplicate');
		} else {
			template = { id: 'templateCreate', icon: 'template', name: translate('menuObjectUseAsTemplate') };
		};

		if (block) {
			if (block.isLocked()) {
				pageLock = { id: 'pageUnlock', icon: 'pageUnlock', name: translate('menuObjectUnlockPage'), caption: keyboard.getCaption('pageLock') };
			} else {
				pageLock = { id: 'pageLock', icon: 'pageLock', name: translate('menuObjectLockPage'), caption: keyboard.getCaption('pageLock') };
			};
		};

		if (object.isArchived) {
			remove = { id: 'pageRemove', icon: 'remove', name: translate('commonDeleteImmediately') };
			archive = { id: 'pageUnarchive', icon: 'restore', name: translate('commonRestoreFromBin'), caption: keyboard.getCaption('moveToBin') };
		} else {
			archive = { id: 'pageArchive', icon: 'remove', name: translate('commonMoveToBin'), caption: keyboard.getCaption('moveToBin') };
		};

		// Restrictions

		const hasShortMenu = (
			isTypeOrRelation ||
			isInFile ||
			isInSet ||
			isParticipant ||
			isChat
		);

		const allowedDetails = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const allowedArchive = canWrite && canDelete;
		const allowedSearch = !isFilePreview && !isInSet && !isChat;
		const allowedHistory = !object.isArchived && !isInFileOrSystem && !isParticipant && !isDate && !isChat && !object.templateIsBundled;
		const allowedLock = canWrite && !object.isArchived && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]) && !isInFileOrSystem;
		const allowedLinkTo = canWrite && !isRelation && !object.isArchived;
		const allowedAddCollection = canWrite && !isRelation && !object.isArchived && !isTemplate;
		const allowedPageLink = !isRelation && !object.isArchived;
		const allowedCopy = canWrite && !object.isArchived && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Duplicate ]) && !isTypeOrRelation;
		const allowedReload = canWrite && object.source && isBookmark;
		const allowedTemplate = canWrite && !U.Object.getLayoutsWithoutTemplates().includes(object.layout) && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Template ]);
		const allowedExport = !isFilePreview && !isChat && !isDate;
		const allowedPrint = !isFilePreview && !isChat;
		const allowedDownloadFile = isInFile;
		const allowedOpenFile = isInFile;
		const allowedOpenObject = isFilePreview;
		const allowedEditType = isType && allowedDetails && !U.Object.isParticipantLayout(object.recommendedLayout) && !U.Object.isTemplateType(object.id);
		const allowedEditChat = isChat;

		if (!allowedPageLink) {
			pageLink = null;
			pageDeeplink = null;
		};

		if (!allowedArchive)		 archive = null;
		if (!allowedLock)			 pageLock = null;
		if (!allowedCopy)			 pageCopy = null;
		if (!allowedReload)			 pageReload = null;
		if (!allowedSearch)			 search = null;
		if (!allowedHistory)		 history = null;
		if (!isTemplate && !allowedTemplate)	 template = null;
		if (!allowedLinkTo)			 linkTo = null;
		if (!allowedAddCollection)	 addCollection = null;
		if (!allowedExport)			 pageExport = null;
		if (!allowedPrint)			 print = null;
		if (!allowedDownloadFile)	 downloadFile = null;
		if (!allowedOpenFile)		 openFile = null;
		if (!allowedOpenObject)		 openObject = null;
		if (!allowedEditType) 		 editType = null;
		if (!allowedEditChat) 		 editChat = null;

		if (!canWrite) {
			template = null;
			setDefaultTemplate = null;
			remove = null;
		};

		advancedOptions.push(pageDeeplink);
		advancedOptions = advancedOptions.filter(it => it);
		if (advancedOptions.length) {
			advanced.children = advancedOptions;
		} else {
			advanced = null;
		};

		let sections = [];
		if (hasShortMenu) {
			if (!U.Object.isInSetLayouts(object.layout)) {
				pageCopy = null;
			};

			sections = sections.concat([
				{ children: [ openObject ] },
				{ children: [ pageLock, history ] },
				{ children: [ linkTo, addCollection, template, pageLink ] },
				{ children: [ search, pageCopy, archive, remove ] },
				{ children: [ print ] },
				{ children: [ openFile, downloadFile ] },
			]);
		} else {
			if (isTemplate) {
				sections = sections.concat([
					{ children: [ openObject ] },
					{ children: [ search, template, pageCopy, setDefaultTemplate, pageExport, archive, history ] },
					{ children: [ print ] },
				]);
			} else
			if (object.isArchived) {
				sections = sections.concat([
					{ children: [ openObject ] },
					{ children: [ search, pageExport, remove, archive ] },
					{ children: [ print ] },
				]);
			} else {
				sections = sections.concat([
					{ children: [ openObject ] },
					{ children: [ pageLock ] },
					{ children: [ linkTo, addCollection, template, pageLink ] },
					{ children: [ search, history, pageCopy, archive ] },
					{ children: [ pageReload ] },
					{ children: [ print, pageExport ] },
				]);
			};

			sections = sections.map((it: any, i: number) => ({ ...it, id: 'page' + i }));
		};

		sections.push({ children: [ advanced ] });
		sections.unshift({ children: [ editType, editChat ] });

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
			S.Menu.closeAll(J.Menu.object);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data, className, classNameWrap } = param;
		const { rootId, blockId } = data;

		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className,
			classNameWrap,
			rebind: this.rebind,
			data: {
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
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
					],
					onSelect: () => close(),
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
					canAdd: true,
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
					onSelect: (el: any) => {
						Action.addToCollection(el.id, [ rootId ]);
					},
					skipIds: [ rootId ],
					canAdd: true,
					addParam: {
						name: translate('blockDataviewCreateNewCollection'),
						nameWithFilter: translate('blockDataviewCreateNewCollectionWithName'),
						onClick: (details: any) => {
							C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, message => {
								Action.addToCollection(message.objectId, [ rootId ]);
								U.Object.openAuto(message.details);
							});
						},
					},
				});
				break;
			};

			case 'advanced': {
				menuId = 'select';
				menuParam.data = {
					options: item.children,
					onSelect: (e, option) => {
						switch (option.id) {

							case 'pageDeeplink': {
								const object = this.getObject();
								const space = U.Space.getSpaceview();

								U.Object.copyLink(object, space, 'deeplink', '');
								close();
								break;
							};

						};
					},
				};
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.object, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	getObject () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, object } = data;

		return object || S.Detail.get(rootId, blockId);
	};
	
	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data, className, classNameWrap } = param;
		const { blockId, rootId, onSelect, onArchive, onDelete } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		const object = this.getObject();
		const route = analytics.route.menuObject;
		const space = U.Space.getSpaceview();
		
		if (item.arrow) {
			return;
		};
		
		const close = true;
		
		if (onSelect) {
			onSelect(item);
		};

		const onBack = () => {
			if (block && !block.isPage()) {
				return;
			};

			const home = U.Space.getDashboard();
			if (home && (object.id == home.id)) {
				U.Object.openRoute({ layout: I.ObjectLayout.Settings, id: 'spaceIndexEmpty' });
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
				U.Object.openAuto({ layout: I.ObjectLayout.History, id: object.id });
				keyboard.disableClose(false);
				break;
			};
			
			case 'search': {
				keyboard.onSearchMenu('', route);
				break;
			};

			case 'pageCopy': {
				C.ObjectListDuplicate([ rootId ], (message: any) => {
					if (!message.error.code && message.ids.length) {
						U.Object.openConfig({ id: message.ids[0], layout: object.layout }, {
							onClose: () => $(window).trigger(`updatePreviewObject.${message.ids[0]}`)
						});

						analytics.event('DuplicateObject', { count: 1, route, objectType: object.type });
					};
				});
				break;
			};

			case 'pageLink': {
				U.Object.copyLink(object, space, 'web', '');
				break;
			};

			case 'pageExport': {
				S.Popup.open('export', { data: { objectIds: [ rootId ], allowHtml: true, route } });
				break;
			};

			case 'pageArchive': {
				Action.archive([ object.id ], route, () => {
					if (onArchive) {
						onArchive();
					} else {
						onBack();
					};
				});
				break;
			};

			case 'pageUnarchive': {
				Action.restore([ object.id ], route);
				break;
			};

			case 'pageRemove': {
				Action.delete([ object.id ], route, () => {
					if (onDelete) {
						onDelete();
					} else {
						onBack();
					};
				});
				break;
			};

			case 'pageLock':
			case 'pageUnlock': {
				keyboard.onLock(rootId, item.id == 'pageLock', route);
				break;
			};

			case 'pageCreate': {
				U.Object.create('', '', { type: object.targetObjectType }, I.BlockPosition.Bottom, rootId, [], route, message => U.Object.openAuto(message.details));
				break;
			};

			case 'pageReload': {
				C.ObjectBookmarkFetch(rootId, object.source, () => {
					analytics.event('ReloadSourceData', { route });
				});
				break;
			};

			case 'templateCreate': {
				C.TemplateCreateFromObject(rootId, (message: any) => {
					U.Object.openConfig({ id: message.id, layout: object.layout });
					Preview.toastShow({ action: I.ToastAction.TemplateCreate, objectId: rootId });

					analytics.event('CreateTemplate', { objectType: object.type, route });
				});
				break;
			};

			case 'setDefault': {
				U.Object.setDefaultTemplateId(object.targetObjectType, rootId);
				Preview.toastShow({ text: translate('toastSetDefaultTemplate') });
				analytics.event('ChangeDefaultTemplate', { route });
				break;
			};

			case 'openFile': {
				Action.openFile(object.id, route);
				break;
			};

			case 'downloadFile': {
				Action.downloadFile(object.id, route, U.Object.isImageLayout(object.layout));
				break;
			};

			case 'openAsObject': {
				U.Object.openAuto(object);
				break;
			};

			case 'editType': {
				sidebar.rightPanelToggle(true, keyboard.isPopup(), 'type', { rootId })
				break;
			};

			case 'editChat': {
				U.Menu.onChatMenu({
					element: `#button-header-more`,
					className,
					classNameWrap,
					data: {
						details: object,
					},
				});
				break;
			};
		};
		
		if (close) {
			this.props.close();
		};
	};

};

export default MenuObject;

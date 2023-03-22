import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, C, keyboard, analytics, DataUtil, ObjectUtil, Util, Preview, focus, Action } from 'Lib';
import { blockStore, detailStore, commonStore, dbStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

class MenuBlockMore extends React.Component<I.Menu> {
	
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
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
								onClick={(e: any) => { this.onClick(e, action); }} 
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
		const { blockId, rootId } = data;
		const { profile } = blockStore;
		const block = blockStore.getLeaf(rootId, blockId);
		const platform = Util.getPlatform();
		const { config } = commonStore;

		if (!block) {
			return [];
		};
		
		const object = detailStore.get(rootId, blockId);
		const cmd = keyboard.cmdSymbol();
		const isTemplate = object.type == Constant.typeId.template;
		
		let template = null;
		let archive = null;
		let fav = null;
		let highlight = null;
		let pageLock = null;
		let pageInstall = null;

		let linkTo = { id: 'linkTo', icon: 'linkTo', name: 'Link to', arrow: true };
		let undo = { id: 'undo', name: 'Undo', caption: `${cmd}+Z` };
		let redo = { id: 'redo', name: 'Redo', caption: `${cmd}+Shift+Z` };
		let print = { id: 'print', name: 'Print', caption: `${cmd}+P` };
		let search = { id: 'search', name: 'Search on page', caption: `${cmd}+F` };
		let move = { id: 'move', name: 'Move to', arrow: true };
		let turn = { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true };
		let align = { id: 'align', name: 'Align', icon: [ 'align', DataUtil.alignIcon(object.layoutAlign) ].join(' '), arrow: true };
		let history = { id: 'history', name: 'Version history', caption: (platform == I.Platform.Mac ? `${cmd}+Y` : `Ctrl+H`) };
		let share = { id: 'pageShare', icon: 'share', name: 'Share' };
		let pageRemove = { id: 'pageRemove', icon: 'remove', name: 'Delete' };
		let pageExport = { id: 'pageExport', icon: 'export', name: 'Export' };
		let pageCopy = { id: 'pageCopy', icon: 'copy', name: 'Duplicate object' };
		let pageLink = { id: 'pageLink', icon: 'link', name: 'Copy link' };
		let pageReload = { id: 'pageReload', icon: 'reload', name: 'Reload from source' };
		let blockRemove = { id: 'blockRemove', icon: 'remove', name: 'Delete' };

		if (object.isFavorite) {
			fav = { id: 'unfav', name: 'Remove from Favorites' };
		} else {
			fav = { id: 'fav', name: 'Add to Favorites' };
		};

		if (isTemplate) {	
			template = { id: 'pageCreate', icon: 'template', name: 'Create object' };
		} else {
			template = { id: 'templateCreate', icon: 'template', name: 'Use as a template' };
		};

		if (object.isArchived) {
			linkTo = null;
			archive = { id: 'pageUnarchive', icon: 'restore', name: 'Restore from bin' };
		} else {
			archive = { id: 'pageArchive', icon: 'remove', name: 'Move to bin' };
		};

		if (object.isHighlighted) {
			highlight = { id: 'unhighlight', icon: 'highlight', name: 'Unhighlight' };
		} else {
			highlight = { id: 'highlight', name: 'Highlight' };
		};

		if (block.isLocked()) {
			pageLock = { id: 'pageUnlock', icon: 'pageUnlock', name: 'Unlock page', caption: `Ctrl+Shift+L` };
		} else {
			pageLock = { id: 'pageLock', icon: 'pageLock', name: 'Lock page', caption: `Ctrl+Shift+L` };
		};

		if (object.isInstalled) {
			pageInstall = { id: 'pageUninstall', icon: 'remove', name: 'Delete' };
		} else {
			pageInstall = { id: 'pageInstall', icon: 'install', name: 'Install' };
		};

		// Restrictions

		const allowedBlock = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Block ]);
		const allowedArchive = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Delete ]);
		const allowedDelete = object.isInstalled && allowedArchive && object.isArchived;
		const allowedShare = block.isObjectSpace() && config.allowSpaces;
		const allowedSearch = !block.isObjectSet() && !block.isObjectSpace();
		const allowedHighlight = !(!object.workspaceId || block.isObjectSpace() || !config.allowSpaces);
		const allowedHistory = block.canHaveHistory() && !object.templateIsBundled;
		const allowedTemplate = (object.type != Constant.typeId.note) && (object.id != profile) && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Template ]);
		const allowedFav = !object.isArchived;
		const allowedLock = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedLink = config.experimental;
		const allowedCopy = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Duplicate ]);
		const allowedReload = object.source && block.isObjectBookmark();
		const allowedInstall = !object.isInstalled && [ Constant.storeTypeId.type, Constant.storeTypeId.relation ].includes(object.type);
		const allowedUninstall = object.isInstalled && [ Constant.typeId.type, Constant.typeId.relation ].includes(object.type) && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Delete ]);
		const hasShortMenu = block.isObjectType() || block.isObjectRelation() || block.isObjectFileKind() || block.isObjectSet() || block.isObjectCollection() || block.isObjectSpace();

		if (!allowedArchive)	 archive = null;
		if (!allowedDelete)		 pageRemove = null;
		if (!allowedLock)		 pageLock = null;
		if (!allowedLink)		 pageLink = null;
		if (!allowedCopy)		 pageCopy = null;
		if (!allowedReload)		 pageReload = null;
		if (!allowedShare)		 share = null;
		if (!allowedHighlight)	 highlight = null;
		if (!allowedSearch)		 search = null;
		if (!allowedHistory)	 history = null;
		if (!allowedBlock)		 undo = redo = null;
		if (!allowedTemplate)	 template = null;
		if (!allowedFav)		 fav = null;
		if (!allowedInstall && !allowedUninstall)	 pageInstall = null;
		if (allowedUninstall)	 archive = null;

		let sections = [];
		if (hasShortMenu) {
			if (!block.isObjectSet() && !block.isObjectCollection()) {
				pageCopy = null;
			};

			sections = [
				{ children: [ archive, pageRemove, pageInstall ] },
				{ children: [ fav, pageLink, linkTo, pageCopy, highlight ] },
				{ children: [ search ] },
				{ children: [ print ] },
				{ children: [ share, highlight ] },
			];
		} else
		if (block.isPage()) {
			console.log('pageRemove', pageRemove, allowedDelete);

			sections = [
				{ children: [ undo, redo, history, archive, pageRemove ] },
				{ children: [ fav, pageLink, linkTo, pageCopy, template, pageLock ] },
				{ children: [ search ] },
				{ children: [ print, pageExport, pageReload ] },
				{ children: [ highlight ] },
			];
			sections = sections.map((it: any, i: number) => { return { ...it, id: 'page' + i }; });
		} else {
			sections.push({ children: [
				turn,
				move,
				align,
				blockRemove,
			]});
		};

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
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.more);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onMenuSelect } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
		let filters = [];
		let menuId = '';
		let menuParam: I.MenuParam = {
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
				blockId,
				blockIds: [ blockId ],
			},
		};

		switch (item.id) {
			case 'turnObject':
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					smartblockTypes: [ I.SmartBlockType.Page ],
					onClick: (item: any) => {
						C.BlockListConvertToObjects(rootId, [ blockId ], item.id);
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
						};
					},
				})
				break;

			case 'move':
				menuId = 'searchObject';

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
				];

				menuParam.data = Object.assign(menuParam.data, {
					filters: filters,
					type: I.NavigationType.Move, 
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
					onSelect: (item: any) => {
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
						};
					}
				});
				break;

			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: block.align,
					onSelect: (align: I.BlockHAlign) => {
						C.BlockListSetAlign(rootId, [ blockId ], align, () => {
							analytics.event('ChangeBlockAlign', { align, count: 1 });
						});
						
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
						};
					}
				});
				break;

			case 'linkTo':
				menuId = 'searchObject';

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.LinkTo,
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
					],
					onSelect: close,
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
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
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect, isPopup } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const object = detailStore.get(rootId, rootId);
		
		if (!block || item.arrow) {
			return;
		};
		
		let close = true;
		
		if (onSelect) {
			onSelect(item);
		};

		const returnToDashboard = () => {
			if (!block.isPage()) {
				return;
			};

			const home = ObjectUtil.getSpaceDashboard();
			if (home && (object.id == home.id)) {
				ObjectUtil.openRoute({ layout: I.ObjectLayout.Empty });
			} else {
				ObjectUtil.openHome('route');
			};
		};

		focus.clear(false);
		
		switch (item.id) {

			case 'undo':
				keyboard.onUndo(rootId);
				close = false;
				break;
				
			case 'redo':
				keyboard.onRedo(rootId);
				close = false;
				break;
				
			case 'print':
				keyboard.onPrint();
				break;

			case 'history':
				keyboard.disableClose(true);
				ObjectUtil.openAuto({ layout: I.ObjectLayout.History, id: object.id });
				break;
			
			case 'search':
				keyboard.onSearchMenu('');
				break;

			case 'pageCopy':
				C.ObjectListDuplicate([ rootId ], (message: any) => {
					if (!message.error.code && message.ids.length) {
						ObjectUtil.openPopup({ id: message.ids[0], layout: object.layout });
					};
					analytics.event('DuplicateObject', { count: 1 });
				});
				break;

			case 'pageExport':
				popupStore.open('export', { data: { rootId } });
				break;
				
			case 'pageArchive':
				C.ObjectSetIsArchived(object.id, true, (message: any) => {
					if (message.error.code) {
						return;
					};

					returnToDashboard();
					analytics.event('MoveToBin', { count: 1 });
				});
				break;

			case 'pageUnarchive':
				C.ObjectSetIsArchived(object.id, false, (message: any) => {
					if (message.error.code) {
						return;
					};

					analytics.event('RestoreFromBin', { count: 1 });
				});
				break;

			case 'pageLock':
				keyboard.onLock(rootId, true);
				break;

			case 'pageUnlock':
				keyboard.onLock(rootId, false);
				break;

			case 'pageCreate':
				ObjectUtil.create('', '', {}, I.BlockPosition.Bottom, rootId, {}, [], (message: any) => {
					ObjectUtil.openRoute({ id: message.targetId });

					analytics.event('CreateObject', {
						route: 'MenuObject',
						objectType: object.targetObjectType,
						layout: object.layout,
						template: (object.templateIsBundled ? object.id : 'custom'),
					});
				});
				break;

			case 'pageRemove':
				C.ObjectListDelete([ object.id ], () => {
					returnToDashboard();
					analytics.event('RemoveCompletely', { count: 1 });
				});
				break;

			case 'pageShare':
				C.ObjectShareByLink(object.id, (message: any) => {
					if (message.error.code) {
						return;
					};

					popupStore.open('prompt', {
						data: {
							title: 'Link to share',
							value: message.link,
							readonly: true,
							select: true,
							textConfirm: 'Copy',
							onChange: (v: string) => {
								Util.clipboardCopy({ text: v });
								Preview.toastShow({ text: 'Link to share copied to clipboard' });
							}
						}
					});
				});
				break;

			case 'pageLink':
				Util.clipboardCopy({ text: Url.protocol + ObjectUtil.route(object) });
				break;

			case 'pageReload':
				C.ObjectBookmarkFetch(rootId, object.source, () => {
					analytics.event('ReloadSourceData');
				});
				break;

			case 'pageInstall':
				Action.install(object, (message: any) => {
					ObjectUtil.openAuto(message.details);
				});
				break;

			case 'pageUninstall':
				Action.uninstall(object, () => { returnToDashboard(); });
				break;

			case 'fav':
				C.ObjectSetIsFavorite(rootId, true, () => {
					analytics.event('AddToFavorites', { count: 1 });
				});
				break;

			case 'unfav':
				C.ObjectSetIsFavorite(rootId, false, () => {
					analytics.event('RemoveFromFavorites', { count: 1 });
				});
				break;

			case 'blockRemove':
				C.BlockListDelete(rootId, [ blockId ], (message: any) => {
					if (!isPopup) {
						returnToDashboard();
					} else {
						popupStore.close('page');
					};
				});
				break;

			case 'templateCreate':
				C.TemplateCreateFromObject(rootId, (message: any) => {
					ObjectUtil.openPopup({ id: message.id, layout: object.layout });

					analytics.event('CreateTemplate', { objectType: object.type });
				});
				break;

			case 'highlight':
				C.WorkspaceSetIsHighlighted(object.id, true, () => {
					analytics.event('Highlight', { count: 1 });
				});
				break;

			case 'unhighlight':
				C.WorkspaceSetIsHighlighted(object.id, false, () => {
					analytics.event('Unhighlight', { count: 1 });
				});
				break;
		};
		
		if (close) {
			this.props.close();
		};
	};

};

export default MenuBlockMore;
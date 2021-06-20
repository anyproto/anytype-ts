import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, focus, crumbs } from 'ts/lib';
import { blockStore, detailStore, commonStore, dbStore, menuStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

const $ = require('jquery');
const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');

class MenuBlockMore extends React.Component<Props, {}> {
	
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const object = detailStore.get(rootId, rootId, []);
		const { config } = commonStore;
		const sections = this.getSections();
		const restrictions = blockStore.getRestrictions(rootId, rootId);
		const restr: any[] = [];

		for (let r of restrictions) {
			restr.push(I.RestrictionObject[r]);
		};

		const Section = (item: any) => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <MenuItemVertical 
							key={i} 
							{...action} 
							icon={action.icon || action.id}
							withCaption={action.caption} 
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>;
					})}
				</div>
			</div>
		);

		let sectionPage = null;
		if (block && block.isPage() && config.allowDataview) {
			sectionPage = (
				<React.Fragment>
					{config.sudo && restr.length ? (
						<div className="section">
							<div className="name">Restrictions</div>
							<div className="items">
								{restr.map((item: any, i: number) => (
									<div className="item" key={i}>{item || 'Empty'}</div>
								))}
							</div>
						</div>
					) : ''}
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
		this.unbind();
		this.setActive();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.more);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		this.props.setHover(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];

		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
			case Key.space:
				if (item) {
					this.onClick(e, item);
				};
				break;
			
			case Key.escape:
				this.props.close();
				break;
		};
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, objectId } = data;
		const { config } = commonStore;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return [];
		};
		
		const object = detailStore.get(rootId, blockId);
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block, I.RestrictionObject.Details ]);
		const cmd = Util.ctrlSymbol();

		let template = null;
		let archive = null;
		let undo = { id: 'undo', name: 'Undo', withCaption: true, caption: `${cmd}+Z` };
		let redo = { id: 'redo', name: 'Redo', withCaption: true, caption: `${cmd}+Shift+Z` };
		let print = { id: 'print', name: 'Print', withCaption: true, caption: `${cmd}+P` };
		let search = { id: 'search', name: 'Search on page', withCaption: true, caption: `${cmd}+F` };
		let move = { id: 'move', name: 'Move to', arrow: true };
		let turn = { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true };
		let align = { id: 'align', name: 'Align', icon: [ 'align', DataUtil.alignIcon(object.layoutAlign) ].join(' '), arrow: true };
		let history = { id: 'history', name: 'Version history', withCaption: true, caption: `${cmd}+Y` };
		let linkRoot = null; 
		let favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
			return it.content.targetBlockId == rootId;
		});

		if (favorites.length) {
			linkRoot = { id: 'unlinkRoot', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			linkRoot = { id: 'linkRoot', icon: 'fav', name: 'Add to Favorites' };
		};

		let sections = [];
		if (block.isObjectType() || block.isObjectRelation() || block.isObjectFile() || block.isObjectImage() || block.isLinkArchive() || block.isObjectSet()) {
			sections = [
				{ children: [ linkRoot ] },
			];
		} else
		if (block.isPage()) {
			if (object.type == Constant.typeId.template) {	
				template = { id: 'createPage', icon: 'template', name: 'Create object' };
			} else {
				template = { id: 'createTemplate', icon: 'template', name: 'Use as a template', arrow: true };
			};

			if (object.isArchived) {
				archive = { id: 'removePage', icon: 'remove', name: 'Delete' };
			} else {
				archive = { id: 'archivePage', icon: 'remove', name: 'Move to archive' };
			};

			// Restrictions

			if (block.isObjectTask()) {
				align = null;
			};

			if (!block.canHaveHistory()) {
				history = null;
			};

			if (!allowed) {
				undo = null;
				redo = null;
				align = null;
				archive = null;
			};

			if (!config.allowDataview) {
				template = null;
			};

			sections = [
				{ children: [ align ] },
				{ children: [ undo, redo, history, archive ] },
				{ children: [ linkRoot, template ] },
				{ children: [ search ] },
				{ children: [ print ] }
			];

			sections = sections.map((it: any, i: number) => {
				it.id = 'page' + i;
				return it;
			});

		} else 
		if (block.isLink()) {
			const object = detailStore.get(rootId, objectId);

			let archive = null;
			let remove = null;
			if (object.isArchived) {
				archive = { id: 'unarchiveIndex', icon: 'remove', name: 'Restore' };
			} else {
				archive = { id: 'archiveIndex', icon: 'remove', name: 'Archive' };
				remove = { id: 'remove', icon: 'unfav', name: 'Remove from Favorites' };
			};

			sections.push({ children: [
				archive,
				remove,
				move,
			]});
		} else {
			sections.push({ children: [
				turn,
				move,
				align,
				//{ id: 'copy', name: 'Duplicate' },
				{ id: 'remove', name: 'Delete' },
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
			this.setActive(item, false);
			this.onOver(item);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, history } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect } = data;
		const { root, breadcrumbs } = blockStore;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block || item.arrow) {
			return;
		};
		
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const prev = children[children.length - 2];
		
		let close = true;
		
		if (onSelect) {
			onSelect(item);
		};

		focus.clear(false);
		
		switch (item.id) {
			case 'undo':
				C.BlockUndo(rootId);
				close = false;
				break;
				
			case 'redo':
				C.BlockRedo(rootId);
				close = false;
				break;
				
			case 'print':
				window.setTimeout(() => { window.print(); }, 300);
				break;
				
			case 'export':
				C.BlockGetPublicWebURL(rootId, (message: any) => {
					if (message.url) {
						ipcRenderer.send('urlOpen', message.url);
					};
				});
				break;

			case 'history':
				history.push('/main/history/' + blockId);
				break;
			
			case 'copy':
				break;

			case 'search':
				ipcRenderer.send('proxyEvent', 'commandEditor', 'search');
				break;
				
			case 'archivePage':
				C.BlockListSetPageIsArchived(rootId, [ blockId ], true, (message: any) => {
					const object = detailStore.get(breadcrumbs, prev.content.targetBlockId, []);
					crumbs.cut(I.CrumbsType.Page, (children.length > 0 ? children.length - 1 : 0));
					
					if (prev) {
						DataUtil.objectOpen(object);
					} else {
						history.push('/main/index');
					};
				});
				break;

			case 'archiveIndex':
				C.BlockListSetPageIsArchived(rootId, [ block.content.targetBlockId ], true);
				break;

			case 'unarchiveIndex':
				C.BlockListSetPageIsArchived(rootId, [ block.content.targetBlockId ], false);
				break;

			case 'linkRoot':
				const newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: block.id,
					}
				};
				C.BlockCreate(newBlock, root, '', I.BlockPosition.Bottom);
				break;

			case 'unlinkRoot':
				let favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
					return it.content.targetBlockId == rootId;
				}).map((it: I.Block) => { return it.id; });

				if (favorites.length) {
					C.BlockUnlink(blockStore.root, favorites);
				};
				break;
				
			case 'remove':
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (block.isPage()) {
						history.push('/main/index');
					};
				});
				break;

			case 'createPage':
				DataUtil.pageCreate('', '', {}, I.BlockPosition.Bottom, rootId, (message: any) => {
					DataUtil.objectOpen({ id: message.targetId });
				});
				break;

			case 'removePage':
				C.BlockListDeletePage([ blockId ], (message: any) => {
					if (block.isPage()) {
						history.push('/main/index');
					};
				});
				break;
		};
		
		if (close) {
			this.props.close();
		};
	};

	onOver (item: any) {
		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.more);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onTurnObject, onAlign } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const object = detailStore.get(rootId, rootId, []);
		const { config } = commonStore;
		
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
				rootId: rootId,
				blockId: blockId,
				blockIds: [ blockId ],
			},
		};

		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; });
		types = types.filter((it: string) => { return it != Constant.typeId.page; });

		switch (item.id) {
			case 'createTemplate':
				menuId = 'searchObject';
				menuParam.className = [ param.className, 'big', 'single' ].join(' ');

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types },
				];

				if (!config.allowDataview) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: [ Constant.typeId.page ] });
				};

				menuParam.data = Object.assign(menuParam.data, {
					isBig: true,
					placeHolder: 'Find a type of object...',
					label: 'Your object type library',
					filters: filters,
					onSelect: (item: any) => {
						C.MakeTemplate(rootId, (message: any) => {
							DataUtil.objectOpen({ id: message.id, layout: object.layout });
						});
						close();
					}
				});
				break;

			case 'turnObject':
				menuId = 'searchObject';
				menuParam.className = [ param.className, 'single' ].join(' ');

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types },
				];

				if (!config.allowDataview) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: [ Constant.typeId.page ] });
				};

				menuParam.data = Object.assign(menuParam.data, {
					placeHolder: 'Find a type of object...',
					label: 'Your object type library',
					filters: filters,
					onSelect: (item: any) => {
						C.BlockListConvertChildrenToPages(rootId, [ blockId ], item.id);
						close();

						if (onTurnObject) {
							onTurnObject(item);
						};
					}
				});
				break;

			case 'move':
				menuId = 'searchObject';
				menuParam.className = [ param.className ].join(' ');

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
				];

				if (!config.allowDataview) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.page ] });
				};

				menuParam.data = Object.assign(menuParam.data, {
					filters: filters,
					type: I.NavigationType.Move, 
					skipId: rootId,
					position: I.BlockPosition.Bottom,
					onSelect: (item: any) => {
						close();
					}
				});
				break;

			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (align: I.BlockAlign) => {
						if (block.isPage()) {
							DataUtil.pageSetAlign(rootId, align);
						} else {
							C.BlockListSetAlign(rootId, [ blockId ], align);
						};
						close();

						if (onAlign) {
							onAlign(item);
						};
					}
				});
				break;

			case 'type':
				menuId = 'searchObject';
				menuParam.vertical = I.MenuDirection.Bottom;
				menuParam.className = [ param.className, 'single' ].join(' ');
				menuParam.offsetY = -36;

				menuParam.data = Object.assign(menuParam.data, {
					placeHolder: 'Find a type of object...',
					label: 'Your object type library',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types },
					],
					onSelect: (item: any) => {
						C.BlockObjectTypeSet(rootId, item.id);
						close();
					}
				});
				break;

			case 'layout':
				menuId = 'select';

				menuParam.data = Object.assign(menuParam.data, {
					options: DataUtil.menuTurnLayouts(),
					value: object.layout,
					onSelect: (e: any, item: any) => {
						DataUtil.pageSetLayout(rootId, item.id);
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

};

export default MenuBlockMore;
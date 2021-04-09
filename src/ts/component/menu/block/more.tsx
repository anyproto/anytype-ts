import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, focus, crumbs } from 'ts/lib';
import { blockStore, commonStore, dbStore, menuStore } from 'ts/store';

interface Props extends I.Menu {
	history?: any;
};

const $ = require('jquery');
const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');

class MenuBlockMore extends React.Component<Props, {}> {
	
	n: number = -1;
	lastId: string = '';
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const items = this.getItems();
		const block = blockStore.getLeaf(rootId, blockId);
		const object = blockStore.getDetails(rootId, rootId);
		const { config } = commonStore;

		let sectionPage = null;
		if (block && block.isPage() && config.allowDataview) {
			const type = dbStore.getObjectType(object.type);
			const layouts = DataUtil.menuGetLayouts();
			const layout = layouts.find((it: any) => { return it.id == object.layout; });
			const readOnly = block.isObjectRelation() || block.isObjectType();

			const itemType = { id: 'type', object: {...type, layout: I.ObjectLayout.ObjectType }, name: (type?.name || Constant.default.name), arrow: !readOnly };
			const itemLayout = { id: 'layout', icon: layout?.icon, name: layout?.name, arrow: !readOnly };

			sectionPage = (
				<div className="section">
					{type ? (
						<React.Fragment>
							<div className="name">Type</div>
							<MenuItemVertical 
								{...itemType}
								onMouseEnter={!readOnly ? (e: any) => { this.onOver(itemType) } : undefined} 
								className={readOnly ? 'isReadOnly' : ''}
							/>
						</React.Fragment>
					) : ''}

					<div className="name">Layout</div>
					<MenuItemVertical 
						{...itemLayout}
						onMouseEnter={!readOnly ? (e: any) => { this.onOver(itemLayout) } : undefined} 
						className={readOnly ? 'isReadOnly' : ''}
					/>
				</div>
			);
		};

		return (
			<div>
				{sectionPage}

				{items.length ? (
					<div className="section">
						{items.map((action: any, i: number) => (
							<MenuItemVertical 
								key={i} 
								{...action}
								icon={action.icon || action.id}
								withCaption={action.caption}
								onClick={(e: any) => { this.onClick(e, action); }} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
							/>
						))}
					</div>
				) : ''}
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
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return [];
		};
		
		const object = blockStore.getDetails(rootId, blockId);
		const cmd = Util.ctrlSymbol();

		const undo = { id: 'undo', name: 'Undo', withCaption: true, caption: `${cmd} + Z` };
		const redo = { id: 'redo', name: 'Redo', withCaption: true, caption: `${cmd} + Shift + Z` };
		const print = { id: 'print', name: 'Print', withCaption: true, caption: `${cmd} + P` };
		const linkRoot = { id: 'linkRoot', icon: 'existing', name: 'Add to dashboard' };
		const search = { id: 'search', name: 'Search on page', withCaption: true, caption: `${cmd} + F` };
		const move = { id: 'move', name: 'Move to', arrow: true };
		const turn = { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true };
		const align = { id: 'align', name: 'Align', icon: [ 'align', DataUtil.alignIcon(object.layoutAlign) ].join(' '), arrow: true };

		let items = [];
		if (block.isObjectType() || block.isObjectRelation() || block.isLinkArchive()) {
		} else
		if (block.isPage()) {
			items = [
				align,
				undo,
				redo,
				print,
				search,
				linkRoot,
				//{ id: 'export', icon: 'export', name: 'Export to web' },
			];

			if (object.type == Constant.typeId.template) {	
				items.push({ id: 'createPage', icon: 'template', name: 'Create object' },);
			} else {
				items.push({ id: 'createTemplate', icon: 'template', name: 'Create a template' });
			};

			if (!block.isObjectSet()) {
				items.push({ id: 'resize', name: 'Resize page' });
			};

			if (block.canHaveHistory()) {
				items.push({ id: 'history', name: 'Version history' });
			};
			
			if (object.isArchived) {
				items.push({ id: 'removePage', icon: 'remove', name: 'Delete' });
			} else {
				items.push({ id: 'archivePage', icon: 'remove', name: 'Archive' });
			};
		} else 
		if (block.isLink()) {
			items = [
				move,
				{ id: 'archiveIndex', icon: 'remove', name: 'Archive' },
				{ id: 'remove', icon: 'remove', name: 'Remove from dashboard' },
			];
		} else {
			items = [
				turn,
				move,
				align,
				//{ id: 'copy', name: 'Duplicate' },
				{ id: 'remove', name: 'Delete' },
			];
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
		const { param, history, getId, getSize } = this.props;
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

			case 'resize':
				$('#editorWrapper').addClass('isResizing');
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
					crumbs.cut(I.CrumbsType.Page, (children.length > 0 ? children.length - 1 : 0));
					
					if (prev) {
						DataUtil.objectOpen({ id: prev.content.targetBlockId });
					} else {
						history.push('/main/index');
					};
				});
				break;

			case 'archiveIndex':
				C.BlockListSetPageIsArchived(rootId, [ block.content.targetBlockId ], true);
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
				
			case 'remove':
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (block.isPage()) {
						history.push('/main/index');
					};
				});
				break;

			case 'createTemplate':
				C.MakeTemplate(rootId, (message: any) => {
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
		const { rootId, blockId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const object = blockStore.getDetails(rootId, rootId);

		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			passThrough: true,
			className: param.className,
			onClose: () => {
				this.lastId = '';
			},
			data: {
				rootId: rootId,
				blockId: blockId,
				blockIds: [ blockId ],
			},
		};

		switch (item.id) {
			case 'turnObject':
				menuId = 'searchObject';
				menuParam.className = [ param.className, 'single' ].join(' ');

				menuParam.data = Object.assign(menuParam.data, {
					placeHolder: 'Find a type of object...',
					label: 'Your object type library',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.ObjectType ] }
					],
					onSelect: (item: any) => {
						C.BlockListConvertChildrenToPages(rootId, [ blockId ], item.id);
						close();
					}
				});
				break;

			case 'move':
				menuId = 'searchObject';
				menuParam.className = [ param.className, 'single' ].join(' ');

				menuParam.data = Object.assign(menuParam.data, {
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
							C.BlockListSetAlign(rootId, [ blockId ], align, (message: any) => {
								focus.apply();
							});
						};
						close();
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
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.ObjectType ] }
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
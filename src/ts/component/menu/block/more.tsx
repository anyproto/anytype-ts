import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, DataUtil, focus, crumbs } from 'ts/lib';
import { blockStore, commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {
	history?: any;
};

const $ = require('jquery');
const { ipcRenderer } = window.require('electron');

@observer
class MenuBlockMore extends React.Component<Props, {}> {
	
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onLayout = this.onLayout.bind(this);
		this.onType = this.onType.bind(this);
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
		if (block.isPage() && config.allowDataview) {
			const objectType = dbStore.getObjectType(object.type, '');
			const layouts = this.getLayouts();
			const layout = layouts.find((it: any) => { return it.id == object.layout; });

			sectionPage = (
				<React.Fragment>
					{objectType ? (
						<React.Fragment>
							<div className="sectionName">Type</div>
							<MenuItemVertical 
								id="object-type" 
								object={{...objectType, layout: I.ObjectLayout.ObjectType }}
								name={objectType.name}
								menuId="select"
								onClick={this.onType} 
								arrow={true}
							/>
						</React.Fragment>
					) : ''}

					<div className="sectionName">Layout</div>
					<MenuItemVertical 
						id="object-layout" 
						icon={layout ? layout.icon : ''} 
						name={layout ? layout.name : 'Select layout'}
						menuId="select"
						onClick={this.onLayout} 
						arrow={true}
					/>
					<div className="line" />
				</React.Fragment>
			);
		};

		return (
			<div>
				{sectionPage}

				<div className="section">
					{items.map((action: any, i: number) => (
						<MenuItemVertical key={i} {...action} onClick={(e: any) => { this.onClick(e, action); }} onMouseEnter={(e: any) => { this.onOver(e, action); }} />
					))}
				</div>
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
		
		const { content } = block;
		const object = blockStore.getDetails(rootId, content.targetBlockId);
		const type = DataUtil.schemaField(object.type);

		let items = [];
		if (block.isObjectSet()) {
			items = [
				{ id: 'undo', icon: 'undo', name: 'Undo' },
				{ id: 'redo', icon: 'redo', name: 'Redo' },
				{ id: 'print', icon: 'print', name: 'Print' },
			];

			if (object.isArchived) {
				items.push({ id: 'removePage', icon: 'remove', name: 'Delete' });
			} else {
				items.push({ id: 'archivePage', icon: 'remove', name: 'Archive' });
			};
		} else
		if (block.isPage()) {
			items = [
				{ id: 'undo', icon: 'undo', name: 'Undo' },
				{ id: 'redo', icon: 'redo', name: 'Redo' },
				{ id: 'print', icon: 'print', name: 'Print' },
				{ id: 'history', icon: 'history', name: 'Version history' },
				{ id: 'search', icon: 'search', name: 'Search on page' },
				//{ id: 'move', icon: 'move', name: 'Move to' },
				//{ id: 'export', icon: 'export', name: 'Export to web' },
			];
			
			if (object.isArchived) {
				items.push({ id: 'removePage', icon: 'remove', name: 'Delete' });
			} else {
				items.push({ id: 'archivePage', icon: 'remove', name: 'Archive' });
			};
		} else 
		if (block.isLinkPage()) {
			items = [
				{ id: 'move', icon: 'move', name: 'Move to' },
			];
			if (type != 'profile') {
				items.push({ id: 'archiveIndex', icon: 'remove', name: 'Archive' });
			};
		} else {
			items = [
				{ id: 'move', icon: 'move', name: 'Move to' },
				//{ id: 'copy', icon: 'copy', name: 'Duplicate' },
				{ id: 'remove', icon: 'remove', name: 'Delete' },
			];
		};
		
		return items;
	};

	getLayouts () {
		return [
			{ id: I.ObjectLayout.Page, icon: 'page', name: 'Page' },
			{ id: I.ObjectLayout.Contact, icon: 'contact', name: 'Contact' },
			{ id: I.ObjectLayout.Task, icon: 'task', name: 'Task' },
			{ id: I.ObjectLayout.Set, icon: 'set', name: 'Set' },
		];
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, history } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect } = data;
		const { breadcrumbs } = blockStore;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
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
			
			case 'move':
				commonStore.popupOpen('navigation', { 
					preventResize: true,
					data: { 
						type: I.NavigationType.Move, 
						...data,
					},
				});
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
						DataUtil.pageOpen(prev.content.targetBlockId);
					} else {
						history.push('/main/index');
					};
				});
				break;

			case 'archiveIndex':
				C.BlockListSetPageIsArchived(rootId, [ block.content.targetBlockId ], true);
				break;

			case 'move':
				commonStore.popupOpen('navigation', { 
					preventResize: true,
					data: { 
						type: I.NavigationType.Move, 
						...data,
					}, 
				});
				break;
				
			case 'remove':
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (block.isPage()) {
						history.push('/main/index');
					};
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

	onLayout (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const object = blockStore.getDetails(rootId, rootId);

		commonStore.menuOpen('select', { 
			element: '#item-object-layout',
			offsetX: 208,
			offsetY: -36,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				options: this.getLayouts(),
				value: object.layout,
				onSelect: (e: any, item: any) => {
					DataUtil.pageSetLayout(rootId, item.id);
					close();
				}
			}
		});
	};

	onType (e: any) {
		const objectTypes = dbStore.objectTypes.filter((it: I.ObjectType) => { return !it.isHidden; });
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = blockStore.getDetails(rootId, rootId);
		const options = objectTypes.map((it: I.ObjectType) => {
			it.layout = I.ObjectLayout.ObjectType;
			return { 
				...it, 
				object: it, 
				id: DataUtil.schemaField(it.url), 
			};
		});

		options.sort((c1: any, c2: any) => {
			if (c1.name > c2.name) return 1;
			if (c1.name < c2.name) return -1;
			return 0;
		});

		commonStore.menuOpen('select', { 
			element: '#item-object-type',
			offsetX: 208,
			offsetY: -36,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				options: options,
				value: DataUtil.schemaField(object.type),
				onSelect: (e: any, item: any) => {
					C.BlockObjectTypeSet(rootId, item.url);
					close();
				}
			}
		});
	};

};

export default MenuBlockMore;
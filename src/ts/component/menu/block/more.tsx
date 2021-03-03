import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, focus, crumbs } from 'ts/lib';
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
			const type = dbStore.getObjectType(object.type);
			const layouts = DataUtil.menuGetLayouts();
			const layout = layouts.find((it: any) => { return it.id == object.layout; });
			const readOnly = block.isObjectRelation() || block.isObjectType();

			sectionPage = (
				<React.Fragment>
					{type ? (
						<React.Fragment>
							<div className="sectionName">Type</div>
							<MenuItemVertical 
								id="object-type" 
								object={{...type, layout: I.ObjectLayout.ObjectType }}
								name={type.name}
								menuId="select"
								onClick={!readOnly ? this.onType : undefined} 
								arrow={!readOnly}
								className={readOnly ? 'isReadOnly' : ''}
							/>
						</React.Fragment>
					) : ''}

					<div className="sectionName">Layout</div>
					<MenuItemVertical 
						id="object-layout" 
						icon={layout ? layout.icon : ''} 
						name={layout ? layout.name : 'Select layout'}
						menuId="select"
						onClick={!readOnly ? this.onLayout : undefined} 
						arrow={!readOnly}
						className={readOnly ? 'isReadOnly' : ''}
					/>
				</React.Fragment>
			);
		};

		return (
			<div>
				{sectionPage}
				{sectionPage && items.length ? <div className="line" /> : ''}

				{items.length ? (
					<div className="section">
						{items.map((action: any, i: number) => (
							<MenuItemVertical 
								key={i} 
								{...action}
								icon={action.icon || action.id}
								withCaption={action.caption}
								onClick={(e: any) => { this.onClick(e, action); }} 
								onMouseEnter={(e: any) => { this.onOver(e, action); }} 
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
		const platform = Util.getPlatform();
		const cmd = platform == I.Platform.Mac ? '&#8984;' : 'Ctrl';

		const undo = { id: 'undo', name: 'Undo', withCaption: true, caption: `${cmd} + Z` };
		const redo = { id: 'redo', name: 'Redo', withCaption: true, caption: `${cmd} + Shift + Z` };
		const print = { id: 'print', name: 'Print', withCaption: true, caption: `${cmd} + P` };
		const link = { id: 'link', icon: 'existing', name: 'Create link' };
		const search = { id: 'search', name: 'Search on page', withCaption: true, caption: `${cmd} + F` };

		let items = [];
		if (block.isObjectSet()) {
			items = [
				undo,
				redo,
				print,
				search,
				link,
			];

			if (object.isArchived) {
				items.push({ id: 'removePage', icon: 'remove', name: 'Delete' });
			} else {
				items.push({ id: 'archivePage', icon: 'remove', name: 'Archive' });
			};
		} else
		if (block.isObjectType() || block.isObjectRelation()) {
		} else
		if (block.isPage()) {
			items = [
				undo,
				redo,
				print,
				search,
				link,
				//{ id: 'export', icon: 'export', name: 'Export to web' },
			];

			if (block.canHaveHistory()) {
				items.push({ id: 'history', name: 'Version history' },);
			};
			
			if (object.isArchived) {
				items.push({ id: 'removePage', icon: 'remove', name: 'Delete' });
			} else {
				items.push({ id: 'archivePage', icon: 'remove', name: 'Archive' });
			};
		} else 
		if (block.isLinkPage()) {
			items = [
				{ id: 'move', name: 'Move to' },
				{ id: 'archiveIndex', icon: 'remove', name: 'Archive' },
			];
		} else {
			items = [
				{ id: 'move', name: 'Move to' },
				//{ id: 'copy', name: 'Duplicate' },
				{ id: 'remove', name: 'Delete' },
			];
		};
		
		return items;
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
						DataUtil.objectOpen({ id: prev.content.targetBlockId });
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

			case 'link':
				commonStore.popupOpen('navigation', { 
					preventResize: true,
					data: { 
						type: I.NavigationType.LinkTo, 
						rootId: rootId,
						blockId: block.id,
						position: I.BlockPosition.Bottom,
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
				options: DataUtil.menuGetLayouts(),
				value: object.layout,
				onSelect: (e: any, item: any) => {
					DataUtil.pageSetLayout(rootId, item.id);
					close();
				}
			}
		});
	};

	onType (e: any) {
		const { config } = commonStore;
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = blockStore.getDetails(rootId, rootId);

		let objectTypes = Util.objectCopy(dbStore.objectTypes);
		if (!config.debug.ho) {
			objectTypes = objectTypes.filter((it: I.ObjectType) => { return !it.isHidden; });
		};

		let options = objectTypes.map((it: I.ObjectType) => {
			it.layout = I.ObjectLayout.ObjectType;
			return { ...it, object: it };
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
				value: object.id,
				onSelect: (e: any, item: any) => {
					C.BlockObjectTypeSet(rootId, item.id);
					close();
				}
			}
		});
	};

};

export default MenuBlockMore;
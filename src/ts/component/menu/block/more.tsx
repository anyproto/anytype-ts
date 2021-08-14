import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, analytics, DataUtil, Util, focus, crumbs } from 'ts/lib';
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
		
		this.rebind = this.rebind.bind(this);
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
		this.rebind();
	};
	
	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.more);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
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
		const allowedBlock = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		const allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		const cmd = keyboard.ctrlSymbol();

		let template = null;
		let archive = null;
		let linkRoot = null;

		let undo = { id: 'undo', name: 'Undo', withCaption: true, caption: `${cmd}+Z` };
		let redo = { id: 'redo', name: 'Redo', withCaption: true, caption: `${cmd}+Shift+Z` };
		let print = { id: 'print', name: 'Print', withCaption: true, caption: `${cmd}+P` };
		let search = { id: 'search', name: 'Search on page', withCaption: true, caption: `${cmd}+F` };
		let move = { id: 'move', name: 'Move to', arrow: true };
		let link = { id: 'link', name: 'Link to', arrow: true };
		let turn = { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true };
		let align = { id: 'align', name: 'Align', icon: [ 'align', DataUtil.alignIcon(object.layoutAlign) ].join(' '), arrow: true };
		let history = { id: 'history', name: 'Version history', withCaption: true, caption: `${cmd}+Y` };
		let favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
			return it.isLink() && (it.content.targetBlockId == rootId);
		});

		if (favorites.length) {
			linkRoot = { id: 'unlinkRoot', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			linkRoot = { id: 'linkRoot', icon: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			//archive = { id: 'removePage', icon: 'remove', name: 'Delete' };
			archive = { id: 'unarchivePage', icon: 'restore', name: 'Restore from archive' };
		} else {
			archive = { id: 'archivePage', icon: 'remove', name: 'Move to archive' };
		};

		if (!allowedDetails) {
			archive = null;
		};

		let sections = [];
		if (block.isObjectType() || block.isObjectRelation() || block.isObjectFileKind() || block.isObjectSet()) {
			sections = [
				{ children: [ archive ] },
				{ children: [ linkRoot, link ] },
				{ children: [ search ] },
				{ children: [ print ] },
			];

			/*
			if (block.isObjectSet()) {
				sections.unshift({ children: [ undo, redo ] });
			};
			*/

		} else
		if (block.isPage()) {
			if (object.type == Constant.typeId.template) {	
				template = { id: 'createPage', icon: 'template', name: 'Create object' };
			} else {
				template = { id: 'createTemplate', icon: 'template', name: 'Use as a template' };
			};

			// Restrictions

			if (!block.canHaveHistory() || object.templateIsBundled) {
				history = null;
			};

			if (!allowedBlock) {
				undo = null;
				redo = null;
			};

			if (!config.allowDataview || (object.type == Constant.typeId.page)) {
				template = null;
			};

			sections = [
				{ children: [ undo, redo, history, archive ] },
				{ children: [ linkRoot, link, template ] },
				{ children: [ search ] },
				{ children: [ print ] },
			];

			sections = sections.map((it: any, i: number) => {
				it.id = 'page' + i;
				return it;
			});
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
				rebind: this.rebind,
				rootId: rootId,
				blockId: blockId,
				blockIds: [ blockId ],
			},
		};

		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; });
		if (config.allowDataview) {
			types = types.filter((it: string) => { return it != Constant.typeId.page; });
		};

		switch (item.id) {
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
					placeholder: 'Find a type of object...',
					label: 'Your object type library',
					filters: filters,
					onSelect: (item: any) => {
						C.BlockListConvertChildrenToPages(rootId, [ blockId ], item.id);
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
						};
					}
				});
				break;

			case 'move':
				menuId = 'searchObject';

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

						if (onMenuSelect) {
							onMenuSelect(item);
						};
					}
				});
				break;

			case 'link':
				menuId = 'searchObject';

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
				];

				if (!config.allowDataview) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.page ] });
				};

				menuParam.data = Object.assign(menuParam.data, {
					filters: filters,
					type: I.NavigationType.LinkTo,
					skipId: rootId,
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
					onSelect: (align: I.BlockAlign) => {
						C.BlockListSetAlign(rootId, [ blockId ], align);
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
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
					placeholder: 'Find a type of object...',
					label: 'Your object type library',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types },
					],
					onSelect: (item: any) => {
						C.BlockObjectTypeSet(rootId, item.id);
						close();

						if (onMenuSelect) {
							onMenuSelect(item);
						};
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

						if (onMenuSelect) {
							onMenuSelect(item);
						};
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
	
	onClick (e: any, item: any) {
		const { param, getId, history } = this.props;
		const { data } = param;
		const { blockId, rootId, onSelect } = data;
		const { root, breadcrumbs } = blockStore;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block || item.arrow) {
			return;
		};
		
		const children = blockStore.getChildren(breadcrumbs, breadcrumbs);
		const prev = children[children.length - 2];
		const object = detailStore.get(rootId, rootId);
		
		let close = true;
		
		if (onSelect) {
			onSelect(item);
		};

		focus.clear(false);
		analytics.event(Util.toUpperCamelCase(`${getId()}-action`), { action: item.id });
		
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
				keyboard.onPrint();
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
				keyboard.onSearch();
				break;
				
			case 'archivePage':
				C.BlockListSetPageIsArchived(rootId, [ blockId ], true, (message: any) => {
					if (message.error.code) {
						return;
					};

					crumbs.cut(I.CrumbsType.Page, (children.length > 0 ? children.length - 1 : 0));

					if ((blockId == rootId) && (object.type == Constant.typeId.type)) {
						dbStore.objectTypeUpdate({ id: object.id, isArchived: true });
					};
					
					if (prev) {
						const object = detailStore.get(breadcrumbs, prev.content.targetBlockId, []);
						DataUtil.objectOpen(object);
					} else {
						history.push('/main/index');
					};
				});
				break;

			case 'unarchivePage':
				C.BlockListSetPageIsArchived(rootId, [ blockId ], false, (message: any) => {
					if (message.error.code) {
						return;
					};

					if ((blockId == rootId) && (object.type == Constant.typeId.type)) {
						dbStore.objectTypeUpdate({ id: object.id, isArchived: false });
					};
				});
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
					return it.isLink() && (it.content.targetBlockId == rootId);
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

					analytics.event('ObjectCreate', {
						objectType: object.targetObjectType,
						layout: object.layout,
						template: (object.templateIsBundled ? object.id : 'custom'),
					});
				});
				break;

			case 'createTemplate':
				C.MakeTemplate(rootId, (message: any) => {
					DataUtil.objectOpenPopup({ id: message.id, layout: object.layout });

					analytics.event('TemplateCreate', { objectType: object.type });
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

};

export default MenuBlockMore;
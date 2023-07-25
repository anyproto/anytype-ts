import * as React from 'react';
import $ from 'jquery';
import { Filter, MenuItemVertical } from 'Component';
import { detailStore, blockStore, menuStore, commonStore, dbStore } from 'Store';
import { I, C, keyboard, UtilData, UtilObject, UtilMenu, focus, Action, translate, analytics, Dataview } from 'Lib';
import Constant from 'json/constant.json';

interface State {
	filter: string;
};

class MenuBlockAction extends React.Component<I.Menu, State> {
	
	_isMounted = false;
	node: any = null;
	n = -1;
	refFilter: any = null;
	state = {
		filter: '',
	};
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const { filter } = this.state;
		const sections = this.getSections();
		
		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						
						if (action.isTextColor) {
							icn.push('textColor textColor-' + (action.value || 'default'));
						};

						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + (action.value || 'default'));
						};

						if (action.isTextColor || action.isBgColor) {
							action.icon = 'color';
							action.inner = <div className={icn.join(' ')} />;
						};

						if (action.isObject) {
							action.object = { ...action, layout: I.ObjectLayout.Type };
						};

						return (
							<MenuItemVertical 
								key={i} 
								{...action} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
								onClick={(e: any) => { this.onClick(e, action); }} 
							/>
						);
					})}
				</div>
			</div>
		);
		
		return (
			<div
				ref={node => this.node = node}
			>
				<Filter 
					ref={ref => this.refFilter = ref} 
					placeholderFocus="Filter actions..." 
					value={filter}
					onFocus={this.onFilterFocus} 
					onChange={this.onFilterChange} 
				/>
				
				{!sections.length ? <div className="item empty">{translate('commonFilterEmpty')}</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		const { getId } = this.props;
		const menu = $(`#${getId()}`);
		
		this._isMounted = true;
		this.rebind();
		this.focus();

		menu.off('mouseleave').on('mouseleave', () => { menuStore.clearTimeout(); });
	};

	componentDidUpdate () {
		this.rebind();
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		keyboard.setFocus(false);
		menuStore.closeAll(Constant.menuIds.action);
		menuStore.clearTimeout();
	};

	focus () {
		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);
	};
	
	onFilterFocus (e: any) {
		menuStore.closeAll(Constant.menuIds.action);
		this.props.setActive();
	};
	
	onFilterChange (v: string) {
		this.n = 0;
		this.setState({ filter: v });
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		const { onKeyDown, param } = this.props;
		const { data } = param;
		const { rootId, blockIds, blockRemove, onCopy } = data;
		const { filter } = this.state;
		const { focused } = focus.state;
		const cmd = keyboard.cmdKey();

		let ret = false;

		if (!filter && blockRemove) {
			keyboard.shortcut('backspace, delete', e, () => {
				blockRemove();
				ret = true;
			});
		};

		keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
			onCopy(e, pressed.match('x') ? true : false);
		});

		if (focused || (!focused && keyboard.isFocused)) {
			keyboard.shortcut(`${cmd}+d`, e, () => {
				Action.duplicate(rootId, rootId, blockIds[blockIds.length - 1], blockIds, I.BlockPosition.Bottom, () => { 
					focus.clear(true); 
				});
				this.refFilter?.blur();
				ret = true;
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};
	
	getSections () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return [];
		};
		
		const { align, content, bgColor, type } = block;
		const { color, style, targetObjectId } = content;

		let sections: any[] = [];
		
		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: 'Text style', children: UtilMenu.getBlockText() };
			const turnList = { id: 'turnList', icon: '', name: 'List style', children: UtilMenu.getBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: 'Turn into object', children: UtilMenu.getTurnPage() };
			const turnDiv = { id: 'turnDiv', icon: '', name: 'Divider style', children: UtilMenu.getTurnDiv() };
			const turnFile = { id: 'turnFile', icon: '', name: 'File style', children: UtilMenu.getTurnFile() };
			const action = { id: 'action', icon: '', name: 'Actions', children: [] };
			const align = { id: 'align', icon: '', name: 'Align', children: [] };
			const bgColor = { id: 'bgColor', icon: '', name: 'Background', children: UtilMenu.getBgColors() };
			const color = { id: 'color', icon: 'color', name: 'Color', arrow: true, children: UtilMenu.getTextColors() };
			const dataview = { id: 'dataview', icon: '', name: 'Dataview', children: UtilMenu.getDataviewActions(rootId, blockId) };

			let hasTurnText = true;
			let hasTurnObject = true;
			let hasTurnList = true;
			let hasTurnDiv = true;
			let hasTurnFile = true;
			let hasText = true;
			let hasFile = true;
			let hasLink = true;
			let hasQuote = false;
			let hasAction = true;
			let hasAlign = true;
			let hasColor = true;
			let hasBg = true;
			let hasBookmark = true;
			let hasDataview = true;

			for (let id of blockIds) {
				const block = blockStore.getLeaf(rootId, id);
				if (!block) {
					continue;
				};

				hasBookmark = block.isBookmark() ? this.checkFlagByObject(targetObjectId) : false;
				hasDataview = block.isDataview() ? this.checkFlagByObject(targetObjectId) : false;

				if (!block.canTurnText())		 hasTurnText = false;
				if (!block.canTurnPage())		 hasTurnObject = false;
				if (!block.canTurnList())		 hasTurnList = false;
				if (!block.isDiv())				 hasTurnDiv = false;
				if (!block.isFile())			 hasTurnFile = false;
				if (!block.isText())			 hasText = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;
				if (!block.isFile())			 hasFile = false;
				if (!block.isLink())			 hasLink = false;
				if (!block.isDataview())		 hasDataview = false;

				if (block.isTextTitle())		 hasAction = false;
				if (block.isTextDescription())	 hasAction = false;
				if (block.isFeatured())			 hasAction = false;
				if (block.isTextQuote())		 hasQuote = true;
			};

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnDiv)		 sections.push(turnDiv);
			if (hasTurnFile)	 sections.push(turnFile);
			if (hasTurnObject)	 sections.push(turnPage);
			if (hasColor)		 sections.push(color);
			if (hasBg)			 sections.push(bgColor);
			if (hasDataview)	 sections.push(dataview);

			if (hasAlign) {
				sections.push({ 
					...align, 
					children: UtilMenu.getAlign(hasQuote),
				});
			};

			if (hasAction) {
				sections.push({ 
					...action, 
					children: UtilMenu.getActions({ hasText, hasFile, hasLink, hasBookmark }),
				});
			};

			sections = UtilMenu.sectionsFilter(sections, filter);
		} else {
			let hasTurnText = true;
			let hasTurnObject = true;
			let hasTurnDiv = true;
			let hasText = true;
			let hasBookmark = true;
			let hasDataview = true;
			let hasFile = true;
			let hasLink = true;
			let hasTitle = false;
			let hasAlign = true;
			let hasColor = true;
			let hasBg = true;

			for (let id of blockIds) {
				const block = blockStore.getLeaf(rootId, id);
				if (!block) {
					continue;
				};

				hasBookmark = block.isBookmark() ? this.checkFlagByObject(targetObjectId) : false;
				hasDataview = block.isDataview() ? this.checkFlagByObject(targetObjectId) : false;

				if (!block.canTurnText() || block.isDiv()) {
					hasTurnText = false;
				};
				if (block.canTurnText() || !block.isDiv()) {
					hasTurnDiv = false;
				};
				if (!block.canTurnPage())		 hasTurnObject = false;
				if (!block.isText())			 hasText = false;
				if (!block.isFile())			 hasFile = false;
				if (!block.isLink())			 hasLink = false;
				if (!block.isDataview())		 hasDataview = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasTitle = true;
				if (block.isTextDescription())	 hasTitle = true;
				if (block.isFeatured())			 hasTitle = true;
			};

			const section1: any = { 
				children: UtilMenu.getActions({ hasText, hasFile, hasLink, hasDataview, hasBookmark, hasTurnObject })
			};

			const section2: any = { 
				children: [
					//{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			};

			if (hasDataview) {
				section2.children = section2.children.concat(UtilMenu.getDataviewActions(rootId, blockId));
			};

			if (hasLink) {
				section2.children.push({ id: 'linkSettings', icon: 'linkStyle' + content.cardStyle, name: 'Preview', arrow: true });
			};

			if (hasFile) {
				section2.children.push({ id: 'turnStyle', icon: 'customize', name: 'Appearance', arrow: true, isFile: true },);
			};

			if (hasTitle) {
				section1.children = [];
			};

			if (hasTurnText) {
				section2.children.push({ id: 'turnStyle', icon: UtilData.styleIcon(I.BlockType.Text, style), name: 'Text style', arrow: true });
			};

			if (hasTurnDiv) {
				section2.children.push({ id: 'turnStyle', icon: UtilData.styleIcon(I.BlockType.Div, style), name: 'Divider style', arrow: true, isDiv: true });
			};

			if (hasAlign) {
				section2.children.push({ id: 'align', icon: [ 'align', UtilData.alignIcon(align) ].join(' '), name: 'Align', arrow: true });
			};

			if (hasColor) {
				section2.children.push({ id: 'color', icon: 'color', name: 'Color', arrow: true, isTextColor: true, value: (color || 'default') });
			};

			if (hasBg) {
				section2.children.push({ id: 'background', icon: 'color', name: 'Background', arrow: true, isBgColor: true, value: (bgColor || 'default') });
			};

			sections = [ section1, section2 ];
		};

		return UtilMenu.sectionsMap(sections);
	};

	checkFlagByObject (id: string): boolean {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		let flag = false;
		if (id) {
			const object = detailStore.get(rootId, id, [ 'isArchived', 'isDeleted' ], true);
			if (!object.isArchived && !object.isDeleted) {
				flag = true;
			};
		};
		return flag;
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
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { param, close, getId, setActive } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};
		
		const { content, hAlign, bgColor } = block;
		const { color } = content;

		setActive(item, false);

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.action);
			return;
		};

		const node = $(this.node);
		const el = node.find(`#item-${item.id}`);
		const offsetX = node.outerWidth();
		
		let ids: string[] = [];
		let filters = [];
		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: offsetX,
			offsetY: node.offset().top - el.offset().top - 36,
			isSub: true,
			data: {
				rootId,
				blockId,
				blockIds,
				rebind: this.rebind,
			},
		};

		switch (item.itemId) {
			case 'turnStyle': {
				menuId = 'blockStyle';

				if (item.isDiv || item.isFile) {
					menuParam.offsetY = 0;
					menuParam.vertical = I.MenuDirection.Center;
				};

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListTurnInto(rootId, blockIds, item.itemId, (message: any) => {
								this.setFocus(blockIds[0]);

								if (item.itemId == I.TextStyle.Toggle) {
									blockIds.forEach(id => blockStore.toggle(rootId, id, true))
								};
							});
						};

						if (item.type == I.BlockType.Div) {
							C.BlockDivListSetStyle(rootId, blockIds, item.itemId, (message: any) => {
								this.setFocus(blockIds[0]);
							});
						};

						if (item.type == I.BlockType.File) {
							C.BlockFileListSetStyle(rootId, blockIds, item.itemId, (message: any) => {
								this.setFocus(blockIds[0]);
							});
						};
						
						close();
					}
				});
				break;
			};

			case 'turnObject': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					onClick: (item: any) => {
						this.moveToPage(item.id);
						close();
					},
				});
				break;
			};

			case 'move': {
				menuId = 'searchObject';

				let skipIds = [ rootId ];
				blockIds.forEach((id: string) => {
					const block = blockStore.getLeaf(rootId, id);
					if (block && block.isLink() && block.content.targetBlockId) {
						skipIds.push(block.content.targetBlockId);
					};
				});

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
					position: I.BlockPosition.Bottom,
					skipIds,
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					canAdd: true,
					onSelect: () => { close(); }
				});
				break;
			};

			case 'color': {
				menuId = 'blockColor';

				menuParam.data = Object.assign(menuParam.data, {
					value: color,
					onChange: (color: string) => {
						C.BlockTextListSetColor(rootId, blockIds, color, (message: any) => {
							this.setFocus(blockIds[0]);
						});

						close();
					}
				});
				break;
			};
				
			case 'background': {
				ids = UtilData.selectionGet(blockId, false, false, this.props);
				menuId = 'blockBackground';

				menuParam.data = Object.assign(menuParam.data, {
					value: bgColor,
					onChange: (color: string) => {
						C.BlockListSetBackgroundColor(rootId, ids, color, (message: any) => {
							this.setFocus(blockIds[0]);

							analytics.event('ChangeBlockBackground', { color: color, count: blockIds.length });
						});

						close();
					}
				});
				break;
			};

			case 'align': {
				menuId = 'blockAlign';
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;

				menuParam.data = Object.assign(menuParam.data, {
					value: hAlign,
					onSelect: (align: I.BlockHAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align, (message: any) => {
							this.setFocus(blockIds[0]);

							analytics.event('ChangeBlockAlign', { align, count: blockIds.length });
						});

						close();
					}
				});
				break;
			};

			case 'linkSettings': {
				menuId = 'blockLinkSettings';
				menuParam.subIds = [ 'select' ];
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;
				break;
			};

			case 'dataviewSource': {
				menuId = 'searchObject';
				menuParam.className = 'single';

				const isCollection = Dataview.isCollection(rootId, blockId);
				const name = isCollection ? 'collection' : 'set';
				const collectionType = dbStore.getCollectionType();

				let addParam: any = {
					name: `Create new ${name}`,
				};
				if (isCollection) {
					addParam.onClick = () => {
						C.ObjectCreate({ layout: I.ObjectLayout.Collection, type: collectionType?.id }, [], '', commonStore.space, () => onCreate());
					};

					filters = filters.concat([
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
					]);
				} else {
					addParam.onClick = () => {
						C.ObjectCreateSet([], {}, '', commonStore.space, () => onCreate());
					};

					filters = filters.concat([
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					]);
				};

				const onCreate = () => {
					window.setTimeout(() => { $(window).trigger(`updateDataviewData.${block.id}`); }, 50);
				};

				menuParam.data = Object.assign(menuParam.data, {
					rootId,
					blockId: block.id,
					value: [ block.content.targetObjectId ],
					blockIds: [ block.id ],
					filters,
					canAdd: true,
					addParam,
					onSelect: (item: any) => {
						C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, onCreate);
					}
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId, item.itemId)) {
			menuStore.closeAll(Constant.menuIds.action, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onClick (e: any, item: any) {
		if (!this._isMounted || item.arrow) {
			return;
		};
		
		const { param, close } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		const ids = UtilData.selectionGet(blockId, false, false, data);

		switch (item.itemId) {
			case 'download': {
				Action.download(block, 'menu');
				break;
			};

			case 'openBookmarkAsObject': {
				UtilObject.openPopup({ id: block.content.targetObjectId, layout: I.ObjectLayout.Bookmark });

				analytics.event('OpenAsObject', { type: block.type });
				break;
			};

			case 'openFileAsObject': {
				UtilObject.openPopup({ id: block.content.hash, layout: I.ObjectLayout.File });

				analytics.event('OpenAsObject', { type: block.type, params: { fileType: block.content.type } });
				break;
			};

			case 'openDataviewFullscreen': {
				UtilObject.openPopup({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId } });
				analytics.event('InlineSetOpenFullscreen');
				break;
			};

			case 'openDataviewObject': {
				UtilObject.openPopup(detailStore.get(rootId, block.content.targetObjectId));
				break;
			};
					
			case 'copy': {
				Action.duplicate(rootId, rootId, ids[ids.length - 1], ids, I.BlockPosition.Bottom);
				break;
			};
				
			case 'remove': {
				Action.remove(rootId, blockId, ids);
				break;
			};
			
			case 'clear': {
				C.BlockTextListClearStyle(rootId, blockIds, () => {
					analytics.event('ClearBlockStyle', { count: blockIds.length });
				});
				break;
			};
				
			default: {
				// Text colors
				if (item.isTextColor) {
					C.BlockTextListSetColor(rootId, blockIds, item.value);
				} else 
					
				// Background colors
				if (item.isBgColor) {
					C.BlockListSetBackgroundColor(rootId, blockIds, item.value, () => {
						analytics.event('ChangeBlockBackground', { color: item.value, count: blockIds.length });
					});
				} else 
					
				// Align
				if (item.isAlign) {
					C.BlockListSetAlign(rootId, blockIds, item.itemId, () => {
						analytics.event('ChangeBlockAlign', { align: item.itemId, count: blockIds.length });
					});
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Div) {
						C.BlockDivListSetStyle(rootId, blockIds, item.itemId);
					} else 
					if (item.type == I.BlockType.File) {
						C.BlockFileListSetStyle(rootId, blockIds, item.itemId);
					} else {
						C.BlockListTurnInto(rootId, blockIds, item.itemId, () => {
							this.setFocus(blockIds[0]);
						});
					};
				} else

				// Objects
				if (item.isObject) {
					this.moveToPage(item.objectTypeId);
				};
				break;
			};
		};

		close();
	};

	moveToPage (type: string) {
		const { param, dataset } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { selection } = dataset || {};
		
		let ids = [];
		if (selection) {
			ids = selection.get(I.SelectType.Block);
		};
		if (!ids.length) {
			ids = [ blockId ];
		};

		C.BlockListConvertToObjects(rootId, ids, type, () => {
			analytics.event('CreateObject', {
				route: 'TurnInto',
				objectType: type,
			});
		});
	};

	setFocus (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		if (!id) {
			return;
		};

		const block = blockStore.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

};

export default MenuBlockAction;
import * as React from 'react';
import $ from 'jquery';
import { Filter, MenuItemVertical } from 'Component';
import { detailStore, blockStore, menuStore, commonStore } from 'Store';
import { I, C, keyboard, UtilData, UtilObject, UtilMenu, focus, Action, translate, analytics, Dataview, UtilCommon } from 'Lib';
const Constant = require('json/constant.json');

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
						const icn: string[] = [ 'inner' ];
						
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
								onMouseEnter={e => this.onMouseEnter(e, action)} 
								onClick={e => this.onClick(e, action)} 
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
					className="outlined"
					placeholderFocus={translate('menuBlockActionsFilterActions')}
					value={filter}
					onFocus={this.onFilterFocus} 
					onChange={this.onFilterChange} 
					focusOnMount={true}
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

		menu.off('mouseleave').on('mouseleave', () => menuStore.clearTimeout());
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
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
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

		if (onCopy) {
			keyboard.shortcut(`${cmd}+c, ${cmd}+x`, e, (pressed: string) => {
				onCopy(e, pressed.match('x') ? true : false);
			});
		};

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
		
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return [];
		};
		
		const { config } = commonStore;
		const { filter } = this.state;
		const { align, content, bgColor } = block;
		const { color, style } = content;
		const checkFlag = this.checkFlagByObject(block.getTargetObjectId());

		let sections: any[] = [];
		let hasText = true;
		let hasLink = true;
		let hasBookmark = true;
		let hasDataview = true;
		let hasFile = true;
		let hasAction = true;
		let hasAlign = true;
		let hasTurnText = true;
		let hasTurnDiv = true;
		let hasTurnObject = true;
		let hasTurnList = true;
		let hasTurnFile = true;
		let hasColor = true;
		let hasBg = true;

		let hasTitle = false;
		let hasQuote = false;
		
		for (const id of blockIds) {
			const block = blockStore.getLeaf(rootId, id);
			if (!block) {
				continue;
			};

			hasBookmark = hasBookmark && (block.isBookmark() ? checkFlag : false);
			hasDataview = hasBookmark && (block.isDataview() ? checkFlag : false);
			hasFile = hasFile && (block.isFile() ? checkFlag : false);
			hasAlign = hasAlign && block.canHaveAlign();
			hasColor = hasColor && block.canHaveColor();
			hasBg = hasBg && block.canHaveBackground();
			hasTurnDiv = hasTurnDiv && !block.canTurnText() && block.isDiv();
			hasTurnText = hasTurnText && block.canTurnText() && !block.isDiv();
			hasTurnObject = hasTurnObject && block.canTurnPage();
			hasTurnList = hasTurnList && block.canTurnList();
			hasTurnFile = hasTurnFile && block.isFile();
			hasText = hasText && block.isText();
			hasLink = hasLink && block.isLink();
			hasQuote = hasQuote && block.isTextQuote();

			if (block.isTextTitle() || block.isTextDescription() || block.isFeatured())	{
				hasAction = false;
				hasTitle = true;
			};
		};

		const actionParam = { rootId, blockId, hasText, hasFile, hasLink, hasBookmark, hasDataview, hasTurnObject };
		const restrictedAlign = [];

		if (!hasText) {
			restrictedAlign.push(I.BlockHAlign.Justify);
		};
		if (hasQuote) {
			restrictedAlign.push(I.BlockHAlign.Center);
		};

		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: translate('menuBlockActionsSectionsTextStyle'), children: UtilMenu.getBlockText() };
			const turnList = { id: 'turnList', icon: '', name: translate('menuBlockActionsSectionsListStyle'), children: UtilMenu.getBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: translate('commonTurnIntoObject'), children: UtilMenu.getTurnPage() };
			const turnDiv = { id: 'turnDiv', icon: '', name: translate('menuBlockActionsSectionsDividerStyle'), children: UtilMenu.getTurnDiv() };
			const turnFile = { id: 'turnFile', icon: '', name: translate('menuBlockActionsSectionsFileStyle'), children: UtilMenu.getTurnFile() };
			const action = { id: 'action', icon: '', name: translate('menuBlockActionsSectionsActions'), children: UtilMenu.getActions(actionParam) };
			const align = { id: 'align', icon: '', name: translate('commonAlign'), children: UtilMenu.getHAlign(restrictedAlign) };
			const bgColor = { id: 'bgColor', icon: '', name: translate('commonBackground'), children: UtilMenu.getBgColors() };
			const color = { id: 'color', icon: 'color', name: translate('commonColor'), arrow: true, children: UtilMenu.getTextColors() };

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnDiv)		 sections.push(turnDiv);
			if (hasTurnFile)	 sections.push(turnFile);
			if (hasTurnObject)	 sections.push(turnPage);
			if (hasColor)		 sections.push(color);
			if (hasBg)			 sections.push(bgColor);
			if (hasAlign)		 sections.push(align);
			if (hasAction)		 sections.push(action);

			sections = UtilMenu.sectionsFilter(sections, filter);
		} else {
			const turnText = { 
				id: 'turnStyle', icon: UtilData.styleIcon(I.BlockType.Text, style), name: translate('menuBlockActionsSectionsTextStyle'), arrow: true,
				caption: (I.TextStyle[style] ? translate(UtilCommon.toCamelCase(`blockName-${I.TextStyle[style]}`)) : ''),
			}

			const c1 = hasTitle ? [] : UtilMenu.getActions(actionParam);
			const c2: any[] = [
				hasLink ? { id: 'linkSettings', icon: `linkStyle${content.cardStyle}`, name: translate('commonPreview'), arrow: true } : null,
				hasTurnFile ? { id: 'turnStyle', icon: 'customize', name: translate('commonAppearance'), arrow: true, isBlockFile: true } : null,
				hasTurnFile ? { id: 'changeFile', icon: 'link', name: translate('menuBlockActionsExistingFile'), arrow: true } : null,
				hasTurnText ? turnText : null,
				hasTurnDiv ? { id: 'turnStyle', icon: UtilData.styleIcon(I.BlockType.Div, style), name: translate('menuBlockActionsSectionsDividerStyle'), arrow: true, isBlockDiv: true } : null,
				hasAlign ? { id: 'align', icon: UtilData.alignHIcon(align), name: translate('commonAlign'), arrow: true } : null,
				hasColor ? { id: 'color', icon: 'color', name: translate('commonColor'), arrow: true, isTextColor: true, value: (color || 'default') } : null,
				hasBg ? { id: 'background', icon: 'color', name: translate('commonBackground'), arrow: true, isBgColor: true, value: (bgColor || 'default') } : null,
			].filter(it => it);

			sections = [ { children: c1 }, { children: c2 } ];
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
			if (!object.isDeleted) {
				flag = true;
			};
		};
		return flag;
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
		const menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: offsetX,
			offsetY: node.offset().top - el.offset().top - 36,
			isSub: true,
			noFlipX: true,
			data: {
				rootId,
				blockId,
				blockIds,
				rebind: this.rebind,
			},
		};

		let ids: string[] = [];
		let filters = [];
		let menuId = '';

		switch (item.itemId) {
			case 'turnStyle': {
				menuId = 'blockStyle';

				if (item.isBlockDiv || item.isBlockFile) {
					menuParam.offsetY = 0;
					menuParam.vertical = I.MenuDirection.Center;
				};

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListTurnInto(rootId, blockIds, item.itemId, (message: any) => {
								this.setFocus(blockIds[0]);

								if (item.itemId == I.TextStyle.Toggle) {
									blockIds.forEach(id => blockStore.toggle(rootId, id, true));
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

			case 'changeFile': {
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getFileLayouts() },
					],
					onSelect: (item: any) => {
						C.BlockFileSetTargetObjectId(rootId, blockId, item.id);
						close();
					}
				});
				break;
			};

			case 'move': {
				menuId = 'searchObject';

				const skipIds = [ rootId ];
				blockIds.forEach((id: string) => {
					const block = blockStore.getLeaf(rootId, id);
					if (block && block.isLink()) {
						skipIds.push(block.getTargetObjectId());
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
					onSelect: () => close()
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

							analytics.event('ChangeBlockColor', { color, count: blockIds.length });
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

							analytics.event('ChangeBlockBackground', { color, count: blockIds.length });
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
				const name = translate(isCollection ? 'commonCollection' : 'commonSet');

				const addParam: any = {
					name: UtilCommon.sprintf(translate('menuBlockActionsCreateNew'), name),
				};
				if (isCollection) {
					addParam.onClick = (details: any) => {
						C.ObjectCreate({ ...details, layout: I.ObjectLayout.Collection }, [], '', Constant.typeKey.collection, commonStore.space, () => onCreate());
					};

					filters = filters.concat([
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
					]);
				} else {
					addParam.onClick = (details: any) => {
						C.ObjectCreateSet([], details, '', commonStore.space, () => onCreate());
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
		const targetObjectId = block.getTargetObjectId();

		switch (item.itemId) {
			case 'download': {
				Action.download(block, 'menu');
				break;
			};

			case 'openAsObject': {
				UtilObject.openConfig(detailStore.get(rootId, targetObjectId));

				const event: any = { type: block.type };
				if (block.isFile()) {
					event.params = { fileType: block.content.type };
				};

				analytics.event('OpenAsObject', event);
				break;
			};

			case 'openDataviewFullscreen': {
				UtilObject.openConfig({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId } });
				analytics.event('InlineSetOpenFullscreen');
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

	moveToPage (typeId: string) {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		
		UtilData.moveToPage(rootId, blockId, typeId, 'TurnInto', this.props);
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

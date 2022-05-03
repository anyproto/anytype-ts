import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, C, keyboard, DataUtil, Util, focus, Action, translate, analytics } from 'ts/lib';
import { commonStore, blockStore, menuStore } from 'ts/store';

interface Props extends I.Menu {};
interface State {
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class MenuBlockAction extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	n: number = -1;
	refFilter: any = null;
	state = {
		filter: '',
	};
	
	constructor (props: any) {
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
								withCaption={action.caption} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
								onClick={(e: any) => { this.onClick(e, action); }} 
							/>
						);
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }} 
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

		menu.unbind('mouseleave').on('mouseleave', () => { menuStore.clearTimeout(); });
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
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	getSections () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const cmd = keyboard.ctrlSymbol();
		const { config } = commonStore;
		
		if (!block) {
			return [];
		};
		
		const { align, content, bgColor, type } = block;
		const { color, style } = content;

		let sections: any[] = [];
		
		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: 'Text style', children: DataUtil.menuGetBlockText() };
			const turnList = { id: 'turnList', icon: '', name: 'List style', children: DataUtil.menuGetBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: 'Turn into object', children: DataUtil.menuGetTurnPage() };
			const turnDiv = { id: 'turnDiv', icon: '', name: 'Divider style', children: DataUtil.menuGetTurnDiv() };
			const turnFile = { id: 'turnFile', icon: '', name: 'File style', children: DataUtil.menuGetTurnFile() };
			const action = { id: 'action', icon: '', name: 'Actions', children: [] };
			const align = { id: 'align', icon: '', name: 'Align', children: [] };
			const bgColor = { id: 'bgColor', icon: '', name: 'Background', children: DataUtil.menuGetBgColors() };
			const color = { id: 'color', icon: 'color', name: 'Color', arrow: true, children: DataUtil.menuGetTextColors() };

			let hasTurnText = true;
			let hasTurnPage = true;
			let hasTurnList = true;
			let hasTurnDiv = true;
			let hasTurnFile = true;
			let hasFile = true;
			let hasLink = true;
			let hasQuote = false;
			let hasAction = true;
			let hasAlign = true;
			let hasColor = true;
			let hasBg = true;

			for (let id of blockIds) {
				const block = blockStore.getLeaf(rootId, id);
				if (!block) {
					continue;
				};

				if (!block.canTurnText())		 hasTurnText = false;
				if (!block.canTurnPage())		 hasTurnPage = false;
				if (!block.canTurnList())		 hasTurnList = false;
				if (!block.isDiv())				 hasTurnDiv = false;
				if (!block.isFile())			 hasTurnFile = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;
				if (!block.isFile())			 hasFile = false;
				if (!block.isLink())			 hasLink = false;

				if (block.isTextTitle())		 hasAction = false;
				if (block.isTextDescription())	 hasAction = false;
				if (block.isFeatured())			 hasAction = false;
				if (block.isTextQuote())		 hasQuote = true;
			};

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnPage)	 sections.push(turnPage);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnDiv)		 sections.push(turnDiv);
			if (hasTurnFile)	 sections.push(turnFile);
			if (hasColor)		 sections.push(color);
			if (hasBg)			 sections.push(bgColor);

			if (hasAlign) {
				align.children = DataUtil.menuGetAlign(hasQuote);
				sections.push(align);
			};
			
			if (hasAction) {
				action.children = DataUtil.menuGetActions(hasFile, hasLink);
				sections.push(action);
			};

			sections = DataUtil.menuSectionsFilter(sections, filter);
		} else {
			const section1: any = { 
				children: [
					{ id: 'remove', icon: 'remove', name: 'Delete', caption: 'Del' },
					{ id: 'copy', icon: 'copy', name: 'Duplicate', caption: `${cmd} + D` },
					{ id: 'move', icon: 'move', name: 'Move to', arrow: true },
				] 
			};
			const section2: any = { 
				children: [
					//{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			};

			let hasTurnText = true;
			let hasTurnObject = true;
			let hasTurnDiv = true;
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

				if (!block.canTurnText() || block.isDiv()) {
					hasTurnText = false;
				};
				if (block.canTurnText() || !block.isDiv()) {
					hasTurnDiv = false;
				};
				if (!block.canTurnPage())		 hasTurnObject = false;
				if (!block.isFile())			 hasFile = false;
				if (!block.isLink())			 hasLink = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasTitle = true;
				if (block.isTextDescription())	 hasTitle = true;
				if (block.isFeatured())			 hasTitle = true;
			};

			if (hasTurnObject) {
				section1.children.splice(2, 0, { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true });
			};

			if (hasFile) {
				section1.children = section1.children.concat([
					{ id: 'download', icon: 'download', name: 'Download' },
					{ id: 'openFileAsObject', icon: 'expand', name: 'Open as object' },
					//{ id: 'rename', icon: 'rename', name: 'Rename' },
					//{ id: 'replace', icon: 'replace', name: 'Replace' }
				]);
				section2.children.push({ id: 'turnStyle', icon: 'customize', name: 'Appearance', arrow: true, isFile: true },);
			};

			if (hasLink) {
				section1.children.push({ id: 'linkSettings', icon: 'customize', name: 'Appearance', arrow: true });
			};

			if (hasTitle) {
				section1.children = [];
			};

			if (hasTurnText) {
				section2.children.push({ id: 'turnStyle', icon: DataUtil.styleIcon(I.BlockType.Text, style), name: 'Text style', arrow: true });
			};

			if (hasTurnDiv) {
				section2.children.push({ id: 'turnStyle', icon: DataUtil.styleIcon(I.BlockType.Div, style), name: 'Divider style', arrow: true, isDiv: true });
			};

			if (hasAlign) {
				section2.children.push({ id: 'align', icon: [ 'align', DataUtil.alignIcon(align) ].join(' '), name: 'Align', arrow: true });
			};

			if (hasColor) {
				section2.children.push({ id: 'color', icon: 'color', name: 'Color', arrow: true, isTextColor: true, value: (color || 'default') });
			};

			if (hasBg) {
				section2.children.push({ id: 'background', icon: 'color', name: 'Background', arrow: true, isBgColor: true, value: (bgColor || 'default') });
			};

			sections = [ section1, section2 ];
		};

		return DataUtil.menuSectionsMap(sections);
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
		
		const { content, align } = block;
		const { color, bgColor } = content;
		const types = DataUtil.getObjectTypesForNewObject(false).map((it: I.ObjectType) => { return it.id; }); 

		setActive(item, false);

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.action);
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);
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
				rootId: rootId,
				blockId: blockId,
				blockIds: blockIds,
				rebind: this.rebind,
			},
		};

		switch (item.itemId) {
			case 'turnStyle':
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

			case 'turnObject':
				menuId = 'searchObject';
				menuParam.className = 'single';

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types },
				];

				menuParam.data = Object.assign(menuParam.data, {
					placeholder: 'Find a type of object...',
					label: 'Your object type library',
					filters: filters,
					onSelect: (item: any) => {
						this.moveToPage(item.id);
						close();
					},
					dataSort: (c1: any, c2: any) => {
						let i1 = types.indexOf(c1.id);
						let i2 = types.indexOf(c2.id);

						if (i1 > i2) return 1;
						if (i1 < i2) return -1;
						return 0;
					}
				});
				break;

			case 'move':
				menuId = 'searchObject';

				filters = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
				];

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
					skipIds: [ rootId ],
					position: I.BlockPosition.Bottom,
					filters: filters,
					onSelect: () => { close(); }
				});
				break;
				
			case 'color':
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
				
			case 'background':
				ids = DataUtil.selectionGet(blockId, false, this.props);
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
				
			case 'align':
				menuId = 'blockAlign';
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;

				menuParam.data = Object.assign(menuParam.data, {
					value: align,
					onSelect: (align: I.BlockAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align, (message: any) => {
							this.setFocus(blockIds[0]);

							analytics.event('ChangeBlockAlign', { align, count: blockIds.length });
						});

						close();
					}
				});
				break;

			case 'linkSettings':
				menuId = 'blockLinkSettings';
				menuParam.subIds = [ 'select' ];
				menuParam.offsetY = 0;
				menuParam.vertical = I.MenuDirection.Center;
				break;
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
		
		const { param, close, getId } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		const ids = DataUtil.selectionGet(blockId, false, data);
		//analytics.event(Util.toUpperCamelCase(`${getId()}-action`), { id: item.itemId });

		switch (item.itemId) {
			case 'download':
				Action.download(block);
				break;

			case 'openFileAsObject':
				DataUtil.objectOpenPopup({ id: block.content.hash, layout: I.ObjectLayout.File });
				break;
					
			case 'copy':
				Action.duplicate(rootId, ids[ids.length - 1], ids);
				break;
				
			case 'remove':
				Action.remove(rootId, blockId, ids);
				break;
				
			default:
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
				};

				if (item.isObject) {
					this.moveToPage(item.objectTypeId);
				};
			
				break;
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

		C.BlockListConvertToObjects(rootId, ids, type);
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
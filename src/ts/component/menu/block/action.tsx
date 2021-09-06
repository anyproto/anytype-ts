import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, DataUtil, Util, focus, Action, translate, analytics } from 'ts/lib';
import { commonStore, blockStore, menuStore, dbStore } from 'ts/store';

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
							icn.push('textColor textColor-' + action.value);
						};

						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + action.value);
						};

						if (action.isTextColor || action.isBgColor) {
							action.icon = 'color';
							action.inner = <div className={icn.join(' ')} />;
						};

						if (action.isObject) {
							action.object = { ...action, layout: I.ObjectLayout.Type };
						};

						return <MenuItemVertical 
							key={i} 
							{...action} 
							withCaption={action.caption} 
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
							onClick={(e: any) => { this.onClick(e, action); }} 
						/>;
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
		
		if (!block) {
			return [];
		};
		
		const { align, content, bgColor, type } = block;
		const { color, style } = content;

		let sections: any[] = [];
		
		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: 'Turn into text', color: '', children: DataUtil.menuGetBlockText() };
			const turnList = { id: 'turnList', icon: '', name: 'Turn into list', color: '', children: DataUtil.menuGetBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: 'Turn into object', color: '', children: DataUtil.menuGetTurnPage() };
			const turnDiv = { id: 'turnDiv', icon: '', name: 'Turn into divider', color: '', children: DataUtil.menuGetTurnDiv() };
			const action = { id: 'action', icon: '', name: 'Actions', color: '', children: [] };
			const align = { id: 'align', icon: '', name: 'Align', color: '', children: [] };
			const bgColor = { id: 'bgColor', icon: '', name: 'Background', color: '', children: DataUtil.menuGetBgColors() };
			const color = { id: 'color', icon: 'color', name: 'Color', color: '', arrow: true, children: DataUtil.menuGetTextColors() };

			let hasTurnText = true;
			let hasTurnPage = true;
			let hasTurnList = true;
			let hasTurnObject = true;
			let hasTurnDiv = true;
			let hasFile = false;
			let hasQuote = false;
			let hasAction = true;
			let hasAlign = true;
			let hasColor = true;
			let hasBg = true;

			for (let id of blockIds) {
				const block = blockStore.getLeaf(rootId, id);
				if (!block.canTurnText())		 hasTurnText = false;
				if (!block.canTurnPage())		 hasTurnPage = false;
				if (!block.canTurnList())		 hasTurnList = false;
				if (!block.isDiv())				 hasTurnDiv = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasAction = false;
				if (block.isTextDescription())	 hasAction = false;
				if (block.isFeatured())			 hasAction = false;
				if (block.isTextQuote())		 hasQuote = true;
				if (block.isFile())				 hasFile = true;
			};

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnPage)	 sections.push(turnPage);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnDiv)		 sections.push(turnDiv);
			if (hasColor)		 sections.push(color);
			if (hasBg)			 sections.push(bgColor);

			if (hasAlign) {
				align.children = DataUtil.menuGetAlign(hasQuote);
				sections.push(align);
			};
			
			if (hasAction) {
				action.children = DataUtil.menuGetActions(hasFile);
				sections.push(action);
			};

			sections = DataUtil.menuSectionsFilter(sections, filter);
		} else {
			sections = [
				{ 
					children: [
						{ id: 'remove', icon: 'remove', name: 'Delete', caption: 'Del' },
						{ id: 'copy', icon: 'copy', name: 'Duplicate', caption: `${cmd} + D` },
						{ id: 'move', icon: 'move', name: 'Move to', arrow: true },
					] 
				},
				{ 
					children: [
						//{ id: 'comment', icon: 'comment', name: 'Comment' },
					]
				},
			];

			let hasTurnText = true;
			let hasTurnObject = true;
			let hasTurnDiv = true;
			let hasFile = true;
			let hasTitle = false;
			let hasAlign = true;
			let hasColor = true;
			let hasBg = true;

			for (let id of blockIds) {
				const block = blockStore.getLeaf(rootId, id);
				if (!block.canTurnText() || block.isDiv()) {
					hasTurnText = false;
				};
				if (block.canTurnText() || !block.isDiv()) {
					hasTurnDiv = false;
				};
				if (!block.canTurnPage())		 hasTurnObject = false;
				if (!block.isFile())			 hasFile = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasTitle = true;
				if (block.isTextDescription())	 hasTitle = true;
				if (block.isFeatured())			 hasTitle = true;
			};

			if (hasTurnObject) {
				sections[0].children.splice(2, 0, { id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true });
			};

			if (hasFile) {
				sections[0].children.push({ id: 'download', icon: 'download', name: 'Download' });
				//sections[0].children.push({ id: 'rename', icon: 'rename', name: 'Rename' })
				//sections[0].children.push({ id: 'replace', icon: 'replace', name: 'Replace' })
			};

			if (hasTitle) {
				sections[0].children = [];
			};

			if (hasTurnText) {
				sections[1].children.push({ id: 'turnStyle', icon: DataUtil.styleIcon(I.BlockType.Text, style), name: 'Text style', arrow: true });
			};

			if (hasTurnDiv) {
				sections[1].children.push({ id: 'turnStyle', icon: DataUtil.styleIcon(I.BlockType.Div, style), name: 'Divider style', arrow: true });
			};

			if (hasAlign) {
				sections[1].children.push({ id: 'align', icon: [ 'align', DataUtil.alignIcon(align) ].join(' '), name: 'Align', arrow: true });
			};

			if (hasColor) {
				sections[1].children.push({ id: 'color', icon: 'color', name: 'Color', arrow: true, isTextColor: true, value: (color || 'black') });
			};

			if (hasBg) {
				sections[1].children.push({ id: 'background', icon: 'color', name: 'Background', arrow: true, isBgColor: true, value: (bgColor || 'default') });
			};
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
		const { blockId, blockIds, rootId, dataset } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		const { config } = commonStore;
		
		if (!block) {
			return;
		};
		
		const { content, align } = block;
		const { color, bgColor } = content;
		const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; }); 

		setActive(item, false);

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.action);
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);
		const offsetX = node.outerWidth();
		const offsetY = -el.outerHeight() - 8;
		
		let filters = [];
		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: offsetX,
			offsetY: offsetY,
			isSub: true,
			data: {
				rootId: rootId,
				blockId: blockId,
				blockIds: blockIds,
				rebind: this.rebind,
				dataset: dataset,
			},
		};

		switch (item.itemId) {
			case 'turnStyle':
				menuId = 'blockStyle';

				menuParam.data = Object.assign(menuParam.data, {
					onSelect: (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListTurnInto(rootId, blockIds, item.itemId, (message: any) => {
								this.setFocus(blockIds[0]);
							});
						};
							
						if (item.type == I.BlockType.Div) {
							C.BlockListSetDivStyle(rootId, blockIds, item.itemId, (message: any) => {
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
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [ Constant.typeId.page ] }
				];

				menuParam.data = Object.assign(menuParam.data, {
					placeholder: 'Find a type of object...',
					label: 'Your object type library',
					filters: filters,
					onSelect: (item: any) => {
						this.moveToPage(item.id);
						close();
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
					skipId: rootId,
					position: I.BlockPosition.Bottom,
					filters: filters,
					onSelect: () => { close(); }
				});
				break;
				
			case 'color':
				menuId = 'blockColor';
				menuParam.offsetY = node.offset().top - el.offset().top - 40;

				menuParam.data = Object.assign(menuParam.data, {
					value: color,
					onChange: (color: string) => {
						C.BlockListSetTextColor(rootId, blockIds, color, (message: any) => {
							this.setFocus(blockIds[0]);
						});

						close();
					}
				});
				break;
				
			case 'background':
				menuId = 'blockBackground';
				menuParam.offsetY = node.offset().top - el.offset().top - 40;

				menuParam.data = Object.assign(menuParam.data, {
					value: bgColor,
					onChange: (color: string) => {
						C.BlockListSetBackgroundColor(rootId, blockIds, color, (message: any) => {
							this.setFocus(blockIds[0]);
						});

						close();
					}
				});
				break;
				
			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: align,
					onSelect: (align: I.BlockAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align, (message: any) => {
							this.setFocus(blockIds[0]);
						});

						close();
					}
				});
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
		analytics.event(Util.toUpperCamelCase(`${getId()}-action`), { id: item.itemId });

		switch (item.itemId) {
			case 'download':
				Action.download(block);
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
					C.BlockListSetTextColor(rootId, blockIds, item.value);
				} else 
					
				// Background colors
				if (item.isBgColor) {
					C.BlockListSetBackgroundColor(rootId, blockIds, item.value);
				} else 
					
				// Align
				if (item.isAlign) {
					C.BlockListSetAlign(rootId, blockIds, item.itemId);
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Div) {
						C.BlockListSetDivStyle(rootId, blockIds, item.itemId);
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
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId, dataset } = data;
		const { selection } = dataset || {};
		
		let ids = [];
		if (selection) {
			ids = selection.get();
		};
		if (!ids.length) {
			ids = [ blockId ];
		};

		C.BlockListConvertChildrenToPages(rootId, ids, type);
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
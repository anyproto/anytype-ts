import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Filter, MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, focus, Action, translate } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};
interface State {
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuBlockAction extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	focus: boolean = false;
	timeout: number = 0;
	n: number = 0;
	ref: any = null;
	state = {
		filter: '',
	};
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
		
		this.onFilterFocus = this.onFilterFocus.bind(this);
		this.onFilterBlur = this.onFilterBlur.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
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
						
						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<Filter ref={(ref: any) => { this.ref = ref; }} onFocus={this.onFilterFocus} onBlur={this.onFilterBlur} onChange={this.onFilterChange} />
				
				{!sections.length ? <div className="item empty">{translate('commonFilterEmpty')}</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		const { getId } = this.props;
		const menu = $('#' + getId());
		
		this._isMounted = true;
		this.rebind();
		this.setActive();

		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
		
		menu.unbind('mouseleave').on('mouseleave', () => {
			window.clearTimeout(this.timeout);
		});
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.rebind();
		this.props.setHover(items[this.n]);
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
		this.unbind();
		keyboard.setFocus(false);
	};
	
	onFilterFocus (e: any) {
		commonStore.menuCloseAll([ 'blockStyle', 'blockColor', 'blockBackground', 'blockAlign' ]);
		
		this.focus = true;
		this.props.setHover();
	};
	
	onFilterBlur (e: any) {
		this.focus = false;
	};
	
	onFilterChange (v: string) {
		this.n = 0;
		this.setState({ filter: v });
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
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
		
		if (!block) {
			return [];
		};
		
		const { align, content, bgColor } = block;
		const { color } = content;

		let sections: any[] = [];
		
		if (filter) {
			const turnText = { id: 'turnText', icon: '', name: 'Turn into text', color: '', children: DataUtil.menuGetBlockText() };
			const turnList = { id: 'turnList', icon: '', name: 'Turn into list', color: '', children: DataUtil.menuGetBlockList() };
			const turnPage = { id: 'turnPage', icon: '', name: 'Turn into page', color: '', children: DataUtil.menuGetTurnPage() };
			const turnObject = { id: 'turnObject', icon: '', name: 'Turn into object', color: '', children: DataUtil.menuGetTurnObject() };
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
				if (!block.canTurnObject())		 hasTurnObject = false;
				if (!block.isDiv())				 hasTurnDiv = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasAction = false;
				if (block.isTextQuote())		 hasQuote = true;
				if (block.isFile())				 hasFile = true;
			};

			if (hasTurnText)	 sections.push(turnText);
			if (hasTurnPage)	 sections.push(turnPage);
			if (hasTurnList)	 sections.push(turnList);
			if (hasTurnObject)	 sections.push(turnObject);
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
						{ id: 'move', icon: 'move', name: 'Move to' },
						{ id: 'copy', icon: 'copy', name: 'Duplicate' },
						{ id: 'remove', icon: 'remove', name: 'Delete' },
					] 
				},
				{ 
					children: [
						//{ id: 'comment', icon: 'comment', name: 'Comment' },
					]
				},
			];

			let hasTurnText = true;
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
				if (!block.isFile())			 hasFile = false;
				if (!block.canHaveAlign())		 hasAlign = false;
				if (!block.canHaveColor())		 hasColor = false;
				if (!block.canHaveBackground())	 hasBg = false;

				if (block.isTextTitle())		 hasTitle = true;
			};

			if (hasTurnText || hasTurnDiv) {
				sections[0].children.push({ id: 'turn', icon: 'turn', name: 'Turn into', arrow: true });
			};

			if (hasFile) {
				sections[0].children.push({ id: 'download', icon: 'download', name: 'Download' });
				//sections[0].children.push({ id: 'rename', icon: 'rename', name: 'Rename' })
				//sections[0].children.push({ id: 'replace', icon: 'replace', name: 'Replace' })
			};

			if (hasTitle) {
				sections[0].children = [];
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
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.props.setHover(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const k = e.key.toLowerCase();

		if (this.focus) {
			if (k == Key.down) {
				this.ref.blur();
				this.n = -1;
			} else 
			if ([ Key.enter, Key.space, Key.tab ].indexOf(k) >= 0) {
				this.ref.blur();
			} else {
				return;
			};
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
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
				
			case Key.right:
				if (item) {
					this.onOver(e, item);
				};
				break;
			
			case Key.tab:
			case Key.enter:
			case Key.space:
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
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
		
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, dataset } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		const { color, bgColor } = content;
		
		const items = this.getItems();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);
		const offsetX = node.outerWidth();
		const offsetY = -el.outerHeight() - 8;
		
		this.n = items.findIndex((it: any) => { return it.id == item.id; });
		this.setActive(item, false);
		window.clearTimeout(this.timeout);
		
		if ((item.id == 'turn') && commonStore.menuIsOpen('blockStyle')) {
			return;
		};
		
		if ((item.id == 'color') && commonStore.menuIsOpen('blockColor')) {
			return;
		};
		
		if ((item.id == 'background') && commonStore.menuIsOpen('blockBackground')) {
			return;
		};
		
		commonStore.menuCloseAll([ 'blockStyle', 'blockColor', 'blockBackground', 'blockAlign' ]);
		
		if (!item.arrow) {
			return;
		};
		
		this.ref.blur();

		let menuId = '';
		let menuParam: I.MenuParam = {
			element: '#item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			isSub: true,
			passThrough: true,
			data: {
				blockId: blockId,
				blockIds: blockIds,
				rootId: rootId,
				rebind: this.rebind,
				dataset: dataset,
			},
		};

		switch (item.key) {
			case 'turn':
				menuId = 'blockStyle';
				menuParam.data.onSelect = (item: any) => {
					if (item.type == I.BlockType.Text) {
						C.BlockListTurnInto(rootId, blockIds, item.key, (message: any) => {
							this.setFocus(blockIds[0]);
						});
					};
						
					if (item.type == I.BlockType.Div) {
						C.BlockListSetDivStyle(rootId, blockIds, item.key, (message: any) => {
							this.setFocus(blockIds[0]);
						});
					};
					
					if (item.type == I.BlockType.Page) {
						this.moveToPage();
					};
					
					this.props.close();
				};
				break;
				
			case 'color':
				menuId = 'blockColor';
				menuParam.offsetY = node.offset().top - el.offset().top - 40;
				menuParam.data.value = color;
				menuParam.data.onChange = (color: string) => {
					C.BlockListSetTextColor(rootId, blockIds, color, (message: any) => {
						this.setFocus(blockIds[0]);
					});

					this.props.close();
				};
				break;
				
			case 'background':
				menuId = 'blockBackground';
				menuParam.offsetY = node.offset().top - el.offset().top - 40;
				menuParam.data.value = bgColor;
				menuParam.data.onChange = (color: string) => {
					C.BlockListSetBackgroundColor(rootId, blockIds, color, (message: any) => {
						this.setFocus(blockIds[0]);
					});

					this.props.close();
				};
				break;
				
			case 'align':
				menuId = 'blockAlign';
				menuParam.data.onChange = (align: I.BlockAlign) => {
					C.BlockListSetAlign(rootId, blockIds, align, (message: any) => {
						this.setFocus(blockIds[0]);
					});

					this.props.close();
				};
				break;
		};

		if (menuId) {
			this.timeout = window.setTimeout(() => {
				commonStore.menuOpen(menuId, menuParam);
			}, Constant.delay.menu);
		};
	};
	
	onClick (e: any, item: any) {
		if (!this._isMounted || item.arrow) {
			return;
		};
		
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
	
		let block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		let ids = DataUtil.selectionGet(blockId, false, data);

		switch (item.key) {
			case 'download':
				Action.download(block);
				break;
					
			case 'move':
				Action.move(rootId, blockId, blockIds);
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
					C.BlockListSetAlign(rootId, blockIds, item.key);
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Page) {
						this.moveToPage();
					} else 
					if (item.type == I.BlockType.Div) {
						C.BlockListSetDivStyle(rootId, blockIds, item.key);
					} else {
						C.BlockListTurnInto(rootId, blockIds, item.key, () => {
							this.setFocus(blockIds[0]);
						});
					};
				};
			
				break;
		};

		this.props.close();
	};

	moveToPage () {
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
		
		C.BlockListConvertChildrenToPages(rootId, ids);
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
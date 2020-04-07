import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, MenuItemVertical } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, dispatcher, focus } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};
interface State {
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

@observer
class MenuBlockAction extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	focus: boolean = false;
	timeout: number = 0;
	n: number = 0;
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
		this.onFilterBlur = this.onFilterBlur.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const { filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return null;
		};
		
		const { content, bgColor } = block;
		const { style, color } = content;
		const sections = this.getSections();
		
		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						
						if (action.id == 'color') {
							if (color) {
								icn.push('textColor textColor-' + color);
							};
							if (bgColor) {
								icn.push('bgColor bgColor-' + bgColor);
							};
						};
						
						if (action.isTextColor) {
							icn.push('textColor textColor-' + action.value);
						};
						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + action.value);
						};
						
						if (action.isTextColor || action.isBgColor) {
							action.icon = 'color';
							action.inner = (
								<div className={icn.join(' ')}>A</div>
							);
						};
						
						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="filter">
					<Input ref={(ref: any) => { this.refFilter = ref; }} placeHolder="Type to filter..." onFocus={this.onFilterFocus} onBlur={this.onFilterBlur} onChange={this.onFilterChange} />
				</div>
				
				{!sections.length ? <div className="item empty">No items match filter</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		const { id } = this.props;
		
		this._isMounted = true;
		this.rebind();
		this.setActive();
		this.refFilter.focus();
		
		const menu = $('#' + Util.toCamelCase('menu-' + id));
		menu.unbind('mouseleave').on('mouseleave', () => {
			window.clearTimeout(this.timeout);
		});
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
		this.unbind();
	};
	
	onFilterFocus (e: any) {
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		commonStore.menuClose('blockAlign');
		
		this.focus = true;
		this.props.setActiveItem();
	};
	
	onFilterBlur (e: any) {
		this.focus = false;
	};
	
	onFilterChange (e: any, v: string) {
		this.setState({ filter: String(v || '').replace(/[\/\\\*]/g, '') });
	};
	
	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		//window.clearTimeout(this.timeout);
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
		
		const { type, align, content } = block;
		const { style } = content;

		let sections: any[] = [
			{ 
				children: [
					//{ id: 'move', icon: 'move', name: 'Move to' },
					{ id: 'copy', icon: 'copy', name: 'Duplicate' },
					{ id: 'remove', icon: 'remove', name: 'Delete' },
					{ id: 'turn', icon: DataUtil.styleIcon(type, style), name: 'Turn into', arrow: true },
				] 
			},
			{ 
				children: [
					{ id: 'align', icon: [ 'align', DataUtil.alignIcon(align) ].join(' '), name: 'Align', arrow: true },
					{ id: 'color', icon: 'color', name: 'Change color', arrow: true, isTextColor: true },
					//{ id: 'comment', icon: 'comment', name: 'Comment' },
				]
			}
		];
		
		// Restrictions
		if (block.isFile()) {
			let idx = sections[0].children.findIndex((it: any) => { return it.id == 'remove'; });
			sections[0].children.splice(++idx, 0, { id: 'download', icon: 'download', name: 'Download' });
			//sections[0].children.splice(++idx, 0, { id: 'rename', icon: 'rename', name: 'Rename' })
			//sections[0].children.splice(++idx, 0, { id: 'replace', icon: 'replace', name: 'Replace' })
		};
		
		if (!block.isText() && !block.isDiv()) {
			sections[0].children = sections[0].children.filter((it: any) => { return [ 'turn' ].indexOf(it.id) < 0; });
		};
		
		if (block.isIcon()) {
			sections = sections.filter((it: any, i: number) => { return i > 0; });
		};
		
		if (filter) {
			const reg = new RegExp(filter, 'gi');
			sections = [];
			
			if (block.isText()) {
				sections = sections.concat([
					{ id: 'turnText', icon: '', name: 'Text', color: '', children: DataUtil.menuGetBlockText() },
					{ id: 'turnList', icon: '', name: 'List', color: '', children: DataUtil.menuGetBlockList() },
					{ id: 'turnObject', icon: '', name: 'Object', color: '', children: DataUtil.menuGetTurnObject() },
				]);
			};
			
			if (block.isDiv()) {
				sections = sections.concat([
					{ id: 'turnDiv', icon: '', name: 'Divider', color: '', children: DataUtil.menuGetBlockOther() },
				]);
			};
			
			sections = sections.concat([
				{ id: 'turnPage', icon: '', name: 'Page', color: '', children: DataUtil.menuGetBlockPage() },
				{ id: 'action', icon: '', name: 'Actions', color: '', children: DataUtil.menuGetActions(block) },
				{ id: 'align', icon: '', name: 'Align', color: '', children: DataUtil.menuGetAlign() },
				{ id: 'bgColor', icon: '', name: 'Background color', color: '', children: DataUtil.menuGetBgColors() },
			]);
			
			if (!block.isCode()) {
				sections.push({ id: 'color', icon: 'color', name: 'Text color', color: '', arrow: true, children: DataUtil.menuGetTextColors() });
			};
			
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter((c: any) => { return c.name.match(reg); });
				s.children = s.children.map((it: any) => {
					it.key = it.id;
					it.id = s.id + '-' + it.id;
					return it;
				});
				return s.children.length > 0;
			});
		};
		
		return sections;
	};
	
	getItems () {
		const { filter } = this.state;
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
		this.props.setActiveItem(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		const k = e.which;
		
		if (this.focus) {
			if (k != Key.down) {
				return;
			};
			this.refFilter.blur();
			this.n = -1;
		};
		
		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const { param } = this.props;
		const { data } = param;
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
				
			case Key.enter:
			case Key.space:
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
				
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	onMouseEnter (e: any, item: any) {
		if (keyboard.mouse) {
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};
		
		const { param } = this.props;
		const { data } = param;
		const { onSelect, blockId, blockIds, rootId, dataset } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return;
		};
		
		const { content } = block;
		const { text, color, bgColor } = content;
		
		const length = String(text || '').length;
		const items = this.getItems();
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find('#item-' + item.id);
		const offsetX = node.outerWidth() + 1;
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
		
		commonStore.menuClose('blockStyle');
		commonStore.menuClose('blockColor');
		commonStore.menuClose('blockAlign');
		
		if (!item.arrow) {
			return;
		};
		
		this.refFilter.blur();
		let menuParam: I.MenuParam = {
			element: '#item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: offsetY,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			isSub: true,
			data: {
				blockId: blockId,
				blockIds: blockIds,
				rootId: rootId,
				rebind: this.rebind,
				dataset: dataset,
			},
		};
		
		this.timeout = window.setTimeout(() => {
			switch (item.id) {
				case 'turn':
					menuParam.data.onSelect = (item: any) => {
						if (item.type == I.BlockType.Text) {
							C.BlockListSetTextStyle(rootId, blockIds, item.id, (message: any) => {
								focus.set(message.blockId, { from: length, to: length });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Div) {
							C.BlockListSetDivStyle(rootId, blockIds, item.id, (message: any) => {
								focus.set(message.blockId, { from: 0, to: 0 });
								focus.apply();
							});
						};
						
						if (item.type == I.BlockType.Page) {
							this.moveToPage();
						};
						
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockStyle', menuParam);
					break;
					
				case 'color':
					menuParam.offsetY = node.offset().top - el.offset().top - 40;
					menuParam.data.valueText = color;
					menuParam.data.valueBg = bgColor;
				
					menuParam.data.onChangeText = (color: string) => {
						C.BlockListSetTextColor(rootId, blockIds, color, (message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					menuParam.data.onChangeBg = (color: string) => {
						C.BlockListSetBackgroundColor(rootId, blockIds, color, (message: any) => {
							focus.set(message.blockId, { from: length, to: length });
							focus.apply();
						});
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockColor', menuParam);
					break;
					
				case 'align':
					menuParam.data.onChange = (align: I.BlockAlign) => {
						C.BlockListSetAlign(rootId, blockIds, align);
						commonStore.menuClose(this.props.id);
					};
					
					commonStore.menuOpen('blockAlign', menuParam);
					break;
			};
		}, Constant.delay.menu);
	};
	
	onClick (e: any, item: any) {
		if (!this._isMounted || item.arrow) {
			return;
		};
		
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId, dataset } = data;
		const { root } = blockStore;
		const { selection } = dataset || {};
		
		let block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};
		
		const { content } = block;
		
		commonStore.menuClose(this.props.id);
		
		switch (item.id) {
			case 'download':
				if (!content.hash) {
					break;
				};
				
				if (block.isImage()) {
					ipcRenderer.send('download', commonStore.imageUrl(content.hash, Constant.size.image));
				} else {
					ipcRenderer.send('download', commonStore.fileUrl(content.hash));
				};
				break;
					
			case 'move':
				commonStore.popupOpen('tree', { 
					data: { 
						type: 'move', 
						rootId: root,
						onConfirm: (id: string) => {
							console.log('Move', id);
						},
					}, 
				});
				break;
				
			case 'copy':
				let ids = selection.get();
				if (!ids.length) {
					ids = [ blockId ];
				};
				
				C.BlockListDuplicate(rootId, ids, ids[ids.length - 1], I.BlockPosition.Bottom, (message: any) => {
					if (message.blockIds && message.blockIds.length) {
						const lastId = message.blockIds[message.blockIds.length - 1];
						const last = blockStore.getLeaf(rootId, lastId);
						
						if (last) {
							const length = String(last.content.text || '').length;
							focus.set(last.id, { from: length, to: length });
							focus.apply();
						};
					};
				});
				break;
				
			case 'remove':
				let next = blockStore.getNextBlock(rootId, blockId, -1, (it: any) => {
					return it.type == I.BlockType.Text;
				});
				
				C.BlockUnlink(rootId, [ blockId ], (message: any) => {
					if (next) {
						let l = String(next.content.text || '').length;
						focus.set(next.id, { from: l, to: l });
						focus.apply();				
					};
				});
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
					C.BlockListSetAlign(rootId, blockIds, item.value);
				} else 
					
				// Blocks
				if (item.isBlock) {
					if (item.type == I.BlockType.Page) {
						this.moveToPage();
					} else 
					if (item.type == I.BlockType.Div) {
						C.BlockListSetDivStyle(rootId, blockIds, item.key);
					} else {
						C.BlockListSetTextStyle(rootId, blockIds, item.key);
					};
				};
			
				break;
		};
	};

	moveToPage () {
		const { param } = this.props;
		const { data } = param;
		const { blockId, blockIds, rootId } = data;
		const { root } = blockStore;
		
		let block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};
		
		const { content } = block;
		DataUtil.moveToPage(rootId, blockIds, { name: content.text }, blockId);
	};

};

export default MenuBlockAction;